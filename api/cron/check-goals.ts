/**
 * GET/POST /api/cron/check-goals — vigia de gols. ⚽
 *
 * Chamada periodicamente (cron externo, ~1 min). Busca os jogos ao vivo,
 * compara com o último placar salvo no Supabase, e dispara push se saiu gol.
 *
 * Autossuficiente: só `fetch` (Supabase REST + football-data) e `web-push`
 * (único import de node_modules) — sem imports relativos, que quebram na Vercel.
 *
 * Env: CRON_SECRET, FOOTBALLDATA_KEY, FOOTBALLDATA_COMPETITION (padrão WC),
 *      SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_*
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'

interface FdTeam {
  name: string | null
  tla?: string | null
}
interface FdMatch {
  id: number
  status: string
  minute?: number | null
  utcDate?: string
  homeTeam: FdTeam
  awayTeam: FdTeam
  score: { fullTime: { home: number | null; away: number | null } }
}

// Nome em PT-BR por código FIFA (as 48 seleções da Copa 2026).
const PT_BY_CODE: Record<string, string> = {
  MEX: 'México', RSA: 'África do Sul', KOR: 'Coreia do Sul', CZE: 'República Tcheca',
  CAN: 'Canadá', BIH: 'Bósnia e Herzegovina', QAT: 'Catar', SUI: 'Suíça',
  BRA: 'Brasil', MAR: 'Marrocos', HAI: 'Haiti', SCO: 'Escócia',
  USA: 'Estados Unidos', PAR: 'Paraguai', AUS: 'Austrália', TUR: 'Turquia',
  GER: 'Alemanha', CUW: 'Curaçao', CIV: 'Costa do Marfim', ECU: 'Equador',
  NED: 'Países Baixos', JPN: 'Japão', SWE: 'Suécia', TUN: 'Tunísia',
  BEL: 'Bélgica', EGY: 'Egito', IRN: 'Irã', NZL: 'Nova Zelândia',
  ESP: 'Espanha', CPV: 'Cabo Verde', KSA: 'Arábia Saudita', URU: 'Uruguai',
  FRA: 'França', SEN: 'Senegal', IRQ: 'Iraque', NOR: 'Noruega',
  ARG: 'Argentina', ALG: 'Argélia', AUT: 'Áustria', JOR: 'Jordânia',
  POR: 'Portugal', COD: 'Rep. Dem. do Congo', UZB: 'Uzbequistão', COL: 'Colômbia',
  ENG: 'Inglaterra', CRO: 'Croácia', GHA: 'Gana', PAN: 'Panamá',
}

// Reserva: nome em inglês (da football-data) → PT-BR, p/ os casos não óbvios.
const PT_BY_NAME: Record<string, string> = {
  brazil: 'Brasil', argentina: 'Argentina', spain: 'Espanha', germany: 'Alemanha',
  france: 'França', england: 'Inglaterra', portugal: 'Portugal', belgium: 'Bélgica',
  netherlands: 'Países Baixos', croatia: 'Croácia', uruguay: 'Uruguai', mexico: 'México',
  'united states': 'Estados Unidos', 'korea republic': 'Coreia do Sul', 'ir iran': 'Irã',
  "côte d'ivoire": 'Costa do Marfim', czechia: 'República Tcheca', 'cape verde': 'Cabo Verde',
  'saudi arabia': 'Arábia Saudita', 'dr congo': 'Rep. Dem. do Congo', switzerland: 'Suíça',
  'bosnia and herzegovina': 'Bósnia e Herzegovina', 'new zealand': 'Nova Zelândia',
  'south africa': 'África do Sul', qatar: 'Catar', turkey: 'Turquia', türkiye: 'Turquia',
  morocco: 'Marrocos', scotland: 'Escócia', paraguay: 'Paraguai', australia: 'Austrália',
  ecuador: 'Equador', japan: 'Japão', sweden: 'Suécia', tunisia: 'Tunísia', egypt: 'Egito',
  senegal: 'Senegal', iraq: 'Iraque', norway: 'Noruega', algeria: 'Argélia', austria: 'Áustria',
  jordan: 'Jordânia', uzbekistan: 'Uzbequistão', colombia: 'Colômbia', ghana: 'Gana',
  panama: 'Panamá', canada: 'Canadá', haiti: 'Haiti', curaçao: 'Curaçao', curacao: 'Curaçao',
}

/** Nome da seleção em PT-BR (por código FIFA, depois por nome; senão o original). */
function ptName(team: FdTeam): string {
  const byCode = team.tla ? PT_BY_CODE[team.tla.toUpperCase()] : undefined
  if (byCode) return byCode
  const byName = team.name ? PT_BY_NAME[team.name.toLowerCase()] : undefined
  return byName || team.name || 'Seleção'
}
interface ScoreRow {
  match_id: string
  home_score: number
  away_score: number
  status: string
  notified: string | null
}
interface SubRow {
  endpoint: string
  p256dh: string
  auth: string
}

const LIVE = new Set(['IN_PLAY', 'PAUSED'])

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  // — Auth —
  const secret = process.env.CRON_SECRET
  if (!secret) {
    res.status(500).json({ error: 'CRON_SECRET não configurada.' })
    return
  }
  const provided =
    (typeof req.query.secret === 'string' ? req.query.secret : '') ||
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (provided !== secret) {
    res.status(401).json({ error: 'Não autorizado.' })
    return
  }

  const sbUrl = process.env.SUPABASE_URL
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const fdKey = process.env.FOOTBALLDATA_KEY
  if (!sbUrl || !sbKey || !fdKey) {
    res.status(500).json({ error: 'Variáveis (SUPABASE_* / FOOTBALLDATA_KEY) ausentes.' })
    return
  }
  const comp = process.env.FOOTBALLDATA_COMPETITION || 'WC'
  const sbHeaders = { apikey: sbKey, Authorization: `Bearer ${sbKey}` }

  // — 1. Jogos ao vivo —
  let matches: FdMatch[]
  try {
    const r = await fetch(`https://api.football-data.org/v4/competitions/${comp}/matches`, {
      headers: { 'X-Auth-Token': fdKey, Accept: 'application/json' },
    })
    if (!r.ok) {
      res.status(502).json({ error: `football-data respondeu ${r.status}` })
      return
    }
    matches = ((await r.json()) as { matches?: FdMatch[] }).matches ?? []
  } catch {
    res.status(502).json({ error: 'Falha ao contatar a football-data.org.' })
    return
  }
  // — 2. Carrega placares/status salvos (tabela pequena: busca tudo) —
  const savedRes = await fetch(
    `${sbUrl}/rest/v1/copa_match_scores?select=match_id,home_score,away_score,status,notified`,
    { headers: sbHeaders },
  )
  const savedRows = savedRes.ok ? ((await savedRes.json()) as ScoreRow[]) : []
  const saved = new Map(savedRows.map((r) => [r.match_id, r]))

  // — 3. Quais jogos avaliar? —
  //   • ao vivo agora (IN_PLAY, PAUSED)
  //   • agendados que começam em até 2h (TIMED) — p/ pegar o pontapé inicial
  //   • salvos que estavam ao vivo (p/ pegar a transição para "encerrado")
  const byId = new Map(matches.map((m) => [String(m.id), m]))
  const SOON = 2 * 60 * 60 * 1000 // 2 horas
  const now = Date.now()
  const aval = new Set<string>()
  for (const m of matches) {
    if (m.status === 'IN_PLAY' || m.status === 'PAUSED') aval.add(String(m.id))
    else if (m.status === 'TIMED' && m.utcDate) {
      const diff = new Date(m.utcDate).getTime() - now
      if (diff <= SOON && diff >= -15 * 60 * 1000) aval.add(String(m.id))
    }
  }
  for (const r of savedRows) if (r.status === 'IN_PLAY' || r.status === 'PAUSED') aval.add(r.match_id)

  const aoVivo = matches.filter((m) => LIVE.has(m.status)).length

  // — 4. Detecta gols e mudanças de status —
  let eventos = 0
  const disparos: Array<{ matchId: string; evento: string }> = []
  const upserts: Array<Record<string, unknown>> = []

  for (const matchId of aval) {
    const m = byId.get(matchId)
    if (!m) continue
    const home = ptName(m.homeTeam)
    const away = ptName(m.awayTeam)
    const hs = m.score.fullTime.home ?? 0
    const as = m.score.fullTime.away ?? 0
    const minute = m.minute != null ? `${m.minute}'` : undefined
    const status = m.status
    const scoreline = `${home} ${hs} x ${as} ${away}`

    const prev = saved.get(matchId)

    // Eventos de status já notificados (persiste no banco) — impede reenvio
    // mesmo se a API oscilar o status (FINISHED → IN_PLAY → FINISHED).
    const done = new Set((prev?.notified ?? '').split(',').filter(Boolean))
    const notify = async (key: string, title: string, body: string) => {
      if (done.has(key)) return
      done.add(key)
      await sendPush({ sbUrl, sbHeaders, matchId, title, body, tag: `status-${matchId}` })
      eventos++
      disparos.push({ matchId, evento: key })
    }

    // Só notifica se já conhecíamos o jogo (1ª vez = só cria a linha-base).
    if (prev) {
      // GOL — controlado pelo PLACAR (só quando aumenta).
      if (status === 'IN_PLAY' || status === 'PAUSED') {
        const corpo = minute ? `${scoreline}  ·  ${minute}` : scoreline
        if (hs > prev.home_score) {
          await sendPush({ sbUrl, sbHeaders, matchId, title: `GOOOL do ${home}! ⚽`, body: corpo, tag: `gol-${matchId}` })
          eventos++; disparos.push({ matchId, evento: 'gol' })
        }
        if (as > prev.away_score) {
          await sendPush({ sbUrl, sbHeaders, matchId, title: `GOOOL do ${away}! ⚽`, body: corpo, tag: `gol-${matchId}` })
          eventos++; disparos.push({ matchId, evento: 'gol' })
        }
      }

      // EVENTOS DE STATUS — cada um no máximo 1 vez por jogo (via `done`).
      if (status === 'IN_PLAY' && (prev.status === 'TIMED' || prev.status === 'SCHEDULED')) {
        await notify('inicio', '⚽ Começou o jogo!', `${home} x ${away}`)
      }
      if (status === 'PAUSED') {
        await notify('intervalo', '⏸️ Intervalo', scoreline)
      }
      if (status === 'IN_PLAY' && done.has('intervalo')) {
        await notify('2tempo', '▶️ Bola rolando — 2º tempo!', scoreline)
      }
      if (status === 'FINISHED' || status === 'AWARDED') {
        await notify('fim', '🏁 Fim de jogo', scoreline)
      }
    }

    // Placar guardado é o MÁXIMO conhecido (a API às vezes oscila pra baixo).
    upserts.push({
      match_id: matchId,
      home_team: home,
      away_team: away,
      home_score: prev ? Math.max(prev.home_score, hs) : hs,
      away_score: prev ? Math.max(prev.away_score, as) : as,
      status,
      notified: [...done].join(','),
      updated_at: new Date().toISOString(),
    })
  }

  // — 5. Atualiza placares/status —
  if (upserts.length) {
    await fetch(`${sbUrl}/rest/v1/copa_match_scores`, {
      method: 'POST',
      headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(upserts),
    })
  }

  res.status(200).json({ ok: true, aoVivo, eventos, disparos })
}

// ── Envio do push para todos os inscritos ───────────────────────────────────

let vapidReady = false
function ensureVapid(): void {
  if (vapidReady) return
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || 'mailto:contato@seudominio.com',
    process.env.VAPID_PUBLIC_KEY || '',
    process.env.VAPID_PRIVATE_KEY || '',
  )
  vapidReady = true
}

async function sendPush(args: {
  sbUrl: string
  sbHeaders: Record<string, string>
  matchId: string
  title: string
  body: string
  tag: string
}): Promise<void> {
  ensureVapid()
  const { sbUrl, sbHeaders, matchId, title, body, tag } = args

  const subsRes = await fetch(
    `${sbUrl}/rest/v1/copa_push_subscriptions?select=endpoint,p256dh,auth`,
    { headers: sbHeaders },
  )
  if (!subsRes.ok) return
  const subs = (await subsRes.json()) as SubRow[]

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icon-gol.png',
    badge: '/icon-gol.png',
    matchId,
    url: `/jogo/${matchId}`,
    tag,
  })

  const mortas: string[] = []
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 120 },
        )
      } catch (err: unknown) {
        const code = (err as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) mortas.push(s.endpoint)
      }
    }),
  )

  // Limpa inscrições mortas.
  await Promise.all(
    mortas.map((e) =>
      fetch(`${sbUrl}/rest/v1/copa_push_subscriptions?endpoint=eq.${encodeURIComponent(e)}`, {
        method: 'DELETE',
        headers: sbHeaders,
      }),
    ),
  )
}
