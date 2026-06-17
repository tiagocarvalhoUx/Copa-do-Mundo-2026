/**
 * GET/POST /api/cron/check-goals — vigia de gols. ⚽
 *
 * Chamada periodicamente (a cada ~1 min) por um cron externo (ex.: cron-job.org).
 * Fluxo:
 *   1. Busca os jogos AO VIVO na football-data.org (no servidor, sem CORS).
 *   2. Compara o placar atual com o último placar salvo (copa_match_scores).
 *   3. Se algum aumentou → GOL! → dispara push para todos os inscritos.
 *   4. Atualiza o placar salvo.
 *
 * Segurança: exige o segredo em ?secret=... ou no header Authorization: Bearer.
 * Configure CRON_SECRET no servidor e no cron externo.
 *
 * Variáveis de ambiente:
 *   CRON_SECRET                — segredo que protege esta rota
 *   FOOTBALLDATA_KEY           — chave da football-data.org (já usada no projeto)
 *   FOOTBALLDATA_COMPETITION   — código da competição (padrão 'WC')
 *   SUPABASE_*, VAPID_*        — ver api/_lib
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase, TBL_SCORES } from '../_lib/supabase'
import { sendGoalNotification } from '../_lib/webpush'

interface FdMatch {
  id: number
  status: string
  minute?: number | null
  homeTeam: { name: string | null }
  awayTeam: { name: string | null }
  score: { fullTime: { home: number | null; away: number | null } }
}

interface ScoreRow {
  match_id: string
  home_score: number
  away_score: number
}

const LIVE_STATUSES = new Set(['IN_PLAY', 'PAUSED'])

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // — Autenticação —
  const secret = process.env.CRON_SECRET
  if (!secret) {
    res.status(500).json({ error: 'CRON_SECRET não configurada no servidor.' })
    return
  }
  const provided =
    (typeof req.query.secret === 'string' ? req.query.secret : '') ||
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (provided !== secret) {
    res.status(401).json({ error: 'Não autorizado.' })
    return
  }

  // — 1. Busca os jogos na football-data.org —
  const key = process.env.FOOTBALLDATA_KEY
  if (!key) {
    res.status(500).json({ error: 'FOOTBALLDATA_KEY não configurada.' })
    return
  }
  const comp = process.env.FOOTBALLDATA_COMPETITION || 'WC'

  let matches: FdMatch[]
  try {
    const r = await fetch(`https://api.football-data.org/v4/competitions/${comp}/matches`, {
      headers: { 'X-Auth-Token': key, Accept: 'application/json' },
    })
    if (!r.ok) {
      res.status(502).json({ error: `football-data respondeu ${r.status}` })
      return
    }
    const data = (await r.json()) as { matches?: FdMatch[] }
    matches = data.matches ?? []
  } catch {
    res.status(502).json({ error: 'Falha ao contatar a football-data.org.' })
    return
  }

  const live = matches.filter((m) => LIVE_STATUSES.has(m.status))
  if (live.length === 0) {
    res.status(200).json({ ok: true, aoVivo: 0, gols: 0 })
    return
  }

  const supabase = getSupabase()

  // — 2. Carrega os placares salvos desses jogos —
  const ids = live.map((m) => String(m.id))
  const { data: savedRows } = await supabase
    .from(TBL_SCORES)
    .select('match_id, home_score, away_score')
    .in('match_id', ids)
  const saved = new Map<string, ScoreRow>((savedRows ?? []).map((r) => [r.match_id, r as ScoreRow]))

  // — 3. Detecta gols e dispara —
  let golsDetectados = 0
  const disparos: Array<{ matchId: string; placar: string; enviadas: number }> = []
  const upserts: Array<Record<string, unknown>> = []

  for (const m of live) {
    const matchId = String(m.id)
    const home = m.homeTeam.name ?? 'Mandante'
    const away = m.awayTeam.name ?? 'Visitante'
    const hs = m.score.fullTime.home ?? 0
    const as = m.score.fullTime.away ?? 0
    const minute = m.minute != null ? `${m.minute}'` : undefined

    const prev = saved.get(matchId)
    upserts.push({
      match_id: matchId,
      home_team: home,
      away_team: away,
      home_score: hs,
      away_score: as,
      status: m.status,
      updated_at: new Date().toISOString(),
    })

    // Primeira vez que vemos este jogo: só cria a linha-base, sem notificar
    // (evita "gol fantasma" de jogos que já estavam rolando).
    if (!prev) continue

    const scoreline = `${home} ${hs} x ${as} ${away}`

    if (hs > prev.home_score) {
      golsDetectados++
      const resumo = await sendGoalNotification({ matchId, scoringTeam: home, scoreline, minute })
      disparos.push({ matchId, placar: scoreline, enviadas: resumo.enviadas })
    }
    if (as > prev.away_score) {
      golsDetectados++
      const resumo = await sendGoalNotification({ matchId, scoringTeam: away, scoreline, minute })
      disparos.push({ matchId, placar: scoreline, enviadas: resumo.enviadas })
    }
  }

  // — 4. Atualiza os placares salvos —
  if (upserts.length) {
    await supabase.from(TBL_SCORES).upsert(upserts, { onConflict: 'match_id' })
  }

  res.status(200).json({ ok: true, aoVivo: live.length, gols: golsDetectados, disparos })
}
