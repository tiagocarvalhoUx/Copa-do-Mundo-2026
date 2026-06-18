/**
 * GET/POST /api/cron/check-goals — vigia de gols e eventos. ⚽
 *
 * Chamada periodicamente (cron externo, ~1 min). Usa a API pública da ESPN
 * (mesma fonte do app) — mais rápida, estável e com ids que CASAM com o app,
 * então a notificação abre o jogo certo. Compara com o estado salvo no Supabase
 * e dispara push (gol, começo, intervalo, 2º tempo, fim) com entrega de alta
 * prioridade.
 *
 * Robustez: cada evento dispara 1x por jogo (coluna `notified`); gols são
 * dedupados pelo placar (guardado o máximo). Inscrições carregadas 1x por ciclo.
 *
 * Env: CRON_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_*,
 *      ESPN_RANGE (opcional, padrão 20260611-20260719).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'
const ESPN_RANGE = process.env.ESPN_RANGE || '20260611-20260719'
const SOON_MS = 2 * 60 * 60 * 1000 // janela p/ começar a vigiar jogos agendados

// Nome em PT-BR a partir do nome em inglês da ESPN (com variações conhecidas).
const PT_BY_NAME: Record<string, string> = {
  brazil: 'Brasil', argentina: 'Argentina', france: 'França', spain: 'Espanha',
  germany: 'Alemanha', portugal: 'Portugal', england: 'Inglaterra', belgium: 'Bélgica',
  netherlands: 'Países Baixos', croatia: 'Croácia', uruguay: 'Uruguai', mexico: 'México',
  'united states': 'Estados Unidos', usa: 'Estados Unidos', canada: 'Canadá',
  morocco: 'Marrocos', japan: 'Japão', 'south korea': 'Coreia do Sul',
  'korea republic': 'Coreia do Sul', iran: 'Irã', 'ir iran': 'Irã',
  'saudi arabia': 'Arábia Saudita', australia: 'Austrália', qatar: 'Catar',
  ecuador: 'Equador', senegal: 'Senegal', ghana: 'Gana', switzerland: 'Suíça',
  tunisia: 'Tunísia', 'ivory coast': 'Costa do Marfim', "côte d'ivoire": 'Costa do Marfim',
  panama: 'Panamá', uzbekistan: 'Uzbequistão', colombia: 'Colômbia', paraguay: 'Paraguai',
  norway: 'Noruega', austria: 'Áustria', turkey: 'Turquia', 'türkiye': 'Turquia',
  scotland: 'Escócia', 'new zealand': 'Nova Zelândia', egypt: 'Egito', algeria: 'Argélia',
  jordan: 'Jordânia', iraq: 'Iraque', 'dr congo': 'Rep. Dem. do Congo',
  'congo dr': 'Rep. Dem. do Congo', 'cape verde': 'Cabo Verde', curacao: 'Curaçao',
  'curaçao': 'Curaçao', haiti: 'Haiti', 'south africa': 'África do Sul',
  czechia: 'República Tcheca', 'czech republic': 'República Tcheca',
  'bosnia and herzegovina': 'Bósnia e Herzegovina', sweden: 'Suécia',
}
function ptName(name: string | undefined): string {
  if (!name) return 'Seleção'
  return PT_BY_NAME[name.toLowerCase().trim()] || name
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

// ── ESPN (shape mínimo) ──────────────────────────────────────────────────────
interface EspnCompetitor {
  homeAway: 'home' | 'away'
  team: { displayName?: string }
  score?: string
}
interface EspnStatus {
  type: { state: 'pre' | 'in' | 'post'; name: string }
  displayClock?: string
}
interface EspnEvent {
  id: string
  date: string
  status: EspnStatus
  competitions: Array<{ competitors: EspnCompetitor[] }>
}

/** Normaliza o status da ESPN p/ 'pre' | 'in' | 'halftime' | 'post'. */
function normStatus(s: EspnStatus): 'pre' | 'in' | 'halftime' | 'post' {
  const state = s.type.state
  if (state === 'pre') return 'pre'
  if (state === 'post') return 'post'
  return s.type.name.toUpperCase().includes('HALFTIME') ? 'halftime' : 'in'
}

async function fetchJson<T>(url: string, headers?: Record<string, string>): Promise<T | null> {
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), 8000)
  try {
    const r = await fetch(url, { headers, signal: ctrl.signal })
    if (!r.ok) return null
    return (await r.json()) as T
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

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
  if (!sbUrl || !sbKey) {
    res.status(500).json({ error: 'SUPABASE_* ausentes.' })
    return
  }
  const sbHeaders = { apikey: sbKey, Authorization: `Bearer ${sbKey}` }

  // — 1. Jogos (ESPN) —
  const board = await fetchJson<{ events?: EspnEvent[] }>(
    `${ESPN_BASE}/scoreboard?dates=${ESPN_RANGE}&limit=300`,
  )
  if (!board) {
    res.status(502).json({ error: 'Falha ao contatar a ESPN.' })
    return
  }
  const events = board.events ?? []

  // — 2. Estado salvo —
  const savedRows =
    (await fetchJson<ScoreRow[]>(
      `${sbUrl}/rest/v1/copa_match_scores?select=match_id,home_score,away_score,status,notified`,
      sbHeaders,
    )) ?? []
  const saved = new Map(savedRows.map((r) => [r.match_id, r]))

  // — 3. Inscrições (1x por ciclo) —
  const subs =
    (await fetchJson<SubRow[]>(
      `${sbUrl}/rest/v1/copa_push_subscriptions?select=endpoint,p256dh,auth`,
      sbHeaders,
    )) ?? []

  // — 4. Quais jogos avaliar? —
  const byId = new Map(events.map((e) => [e.id, e]))
  const now = Date.now()
  const aval = new Set<string>()
  for (const e of events) {
    const st = normStatus(e.status)
    if (st === 'in' || st === 'halftime') aval.add(e.id)
    else if (st === 'pre') {
      const diff = new Date(e.date).getTime() - now
      if (diff <= SOON_MS && diff >= -15 * 60 * 1000) aval.add(e.id)
    }
  }
  for (const r of savedRows) if (r.status === 'in' || r.status === 'halftime') aval.add(r.match_id)

  // — 5. Detecta e dispara —
  let aoVivo = 0
  let eventos = 0
  const disparos: Array<{ matchId: string; evento: string }> = []
  const upserts: Array<Record<string, unknown>> = []

  for (const matchId of aval) {
    const e = byId.get(matchId)
    if (!e) continue
    const comp = e.competitions[0]
    const hc = comp?.competitors.find((c) => c.homeAway === 'home')
    const ac = comp?.competitors.find((c) => c.homeAway === 'away')
    const home = ptName(hc?.team.displayName)
    const away = ptName(ac?.team.displayName)
    const hs = Number(hc?.score ?? 0) || 0
    const as = Number(ac?.score ?? 0) || 0
    const status = normStatus(e.status)
    const minute = e.status.displayClock ? e.status.displayClock.replace(/['\s]+$/, "'") : undefined
    const scoreline = `${home} ${hs} x ${as} ${away}`
    if (status === 'in' || status === 'halftime') aoVivo++

    const prev = saved.get(matchId)
    const done = new Set((prev?.notified ?? '').split(',').filter(Boolean))

    const notify = async (key: string, title: string, body: string) => {
      if (done.has(key)) return
      done.add(key)
      await sendPush(subs, sbUrl, sbHeaders, { matchId, title, body, tag: `status-${matchId}` })
      eventos++
      disparos.push({ matchId, evento: key })
    }

    if (prev) {
      // GOL — pelo placar (durante o jogo)
      if (status === 'in' || status === 'halftime') {
        const corpo = minute ? `${scoreline}  ·  ${minute}` : scoreline
        if (hs > prev.home_score) {
          await sendPush(subs, sbUrl, sbHeaders, { matchId, title: `GOOOL do ${home}! ⚽`, body: corpo, tag: `gol-${matchId}` })
          eventos++; disparos.push({ matchId, evento: 'gol' })
        }
        if (as > prev.away_score) {
          await sendPush(subs, sbUrl, sbHeaders, { matchId, title: `GOOOL do ${away}! ⚽`, body: corpo, tag: `gol-${matchId}` })
          eventos++; disparos.push({ matchId, evento: 'gol' })
        }
      }
      // EVENTOS DE STATUS (1x cada)
      if (prev.status === 'pre' && (status === 'in' || status === 'halftime')) {
        await notify('inicio', '⚽ Começou o jogo!', `${home} x ${away}`)
      }
      if (status === 'halftime') {
        await notify('intervalo', '⏸️ Intervalo', scoreline)
      }
      if (status === 'in' && done.has('intervalo')) {
        await notify('2tempo', '▶️ Bola rolando — 2º tempo!', scoreline)
      }
      if (status === 'post') {
        await notify('fim', '🏁 Fim de jogo', scoreline)
      }
    }

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

  // — 6. Persiste —
  if (upserts.length) {
    await fetch(`${sbUrl}/rest/v1/copa_match_scores`, {
      method: 'POST',
      headers: { ...sbHeaders, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify(upserts),
    })
  }

  res.status(200).json({ ok: true, fonte: 'espn', aoVivo, eventos, disparos })
}

// ── Envio do push (alta prioridade) ─────────────────────────────────────────

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

async function sendPush(
  subs: SubRow[],
  sbUrl: string,
  sbHeaders: Record<string, string>,
  msg: { matchId: string; title: string; body: string; tag: string },
): Promise<void> {
  ensureVapid()
  if (!subs.length) return

  const payload = JSON.stringify({
    title: msg.title,
    body: msg.body,
    icon: '/icone-bola.png',
    badge: '/icone-bola.png',
    matchId: msg.matchId,
    url: `/jogo/${msg.matchId}`, // ids da ESPN casam com o app
    tag: msg.tag,
  })

  const mortas: string[] = []
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          {
            TTL: 600, // 10 min: entrega mesmo se o aparelho ficar pouco offline
            urgency: 'high', // força entrega imediata (evita atraso por doze/economia)
            topic: msg.tag, // colapsa msgs pendentes do mesmo jogo/tipo
          },
        )
      } catch (err: unknown) {
        const code = (err as { statusCode?: number }).statusCode
        if (code === 404 || code === 410) mortas.push(s.endpoint)
      }
    }),
  )

  if (mortas.length) {
    await Promise.all(
      mortas.map((e) =>
        fetch(`${sbUrl}/rest/v1/copa_push_subscriptions?endpoint=eq.${encodeURIComponent(e)}`, {
          method: 'DELETE',
          headers: sbHeaders,
        }),
      ),
    )
  }
}
