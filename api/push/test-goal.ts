/**
 * POST/GET /api/push/test-goal — dispara um GOL de TESTE para todos os inscritos.
 * Valida o pipeline sem esperar jogo real. Protegido pelo CRON_SECRET.
 * Autossuficiente: só `fetch` (Supabase REST) e `web-push`.
 *
 *   curl -X POST "https://SEU-APP.vercel.app/api/push/test-goal?secret=SEU_SEGREDO"
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import webpush from 'web-push'

interface SubRow {
  endpoint: string
  p256dh: string
  auth: string
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
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
    res.status(500).json({ error: 'SUPABASE_* não configuradas.' })
    return
  }
  if (!process.env.VAPID_PRIVATE_KEY || !process.env.VAPID_PUBLIC_KEY) {
    res.status(500).json({ error: 'VAPID_* não configuradas.' })
    return
  }

  const sbHeaders = { apikey: sbKey, Authorization: `Bearer ${sbKey}` }

  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:contato@seudominio.com',
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY,
    )

    const subsRes = await fetch(
      `${sbUrl}/rest/v1/copa_push_subscriptions?select=endpoint,p256dh,auth`,
      { headers: sbHeaders },
    )
    if (!subsRes.ok) {
      res.status(500).json({ error: `Supabase respondeu ${subsRes.status}` })
      return
    }
    const subs = (await subsRes.json()) as SubRow[]

    const payload = JSON.stringify({
      title: 'GOOOL do Brasil! ⚽',
      body: 'Brasil 1 x 0 Argentina (teste)  ·  ⚽ Vinícius Jr.  ·  23\'',
      icon: '/icone-bola.png',
      badge: '/icone-bola.png',
      matchId: 0,
      url: '/resultados',
      tag: 'gol-teste',
    })

    let enviadas = 0
    let falhas = 0
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            payload,
            { TTL: 120 },
          )
          enviadas++
        } catch {
          falhas++
        }
      }),
    )

    res.status(200).json({ ok: true, inscritos: subs.length, enviadas, falhas })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Falha no disparo de teste.' })
  }
}
