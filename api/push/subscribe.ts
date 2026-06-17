/**
 * POST /api/push/subscribe — grava a subscription no Supabase (via REST puro).
 *
 * Autossuficiente de propósito: SEM imports relativos e SEM SDK — na Vercel
 * (com "type": "module") imports de arquivos locais quebram em runtime, então
 * falamos com o Supabase só via fetch na API REST (PostgREST).
 *
 * Env (servidor): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

interface PushSubscriptionJSON {
  endpoint: string
  keys?: { p256dh?: string; auth?: string }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' })
    return
  }

  let sub: PushSubscriptionJSON
  try {
    sub = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    res.status(400).json({ error: 'JSON inválido.' })
    return
  }
  if (!sub || !sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    res.status(400).json({ error: 'Subscription inválida.' })
    return
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configuradas.' })
    return
  }

  try {
    const r = await fetch(`${url}/rest/v1/copa_push_subscriptions`, {
      method: 'POST',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates', // upsert por endpoint (PK)
      },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
      }),
    })
    if (!r.ok) {
      const detail = await r.text()
      console.error('[subscribe] Supabase respondeu', r.status, detail)
      res.status(500).json({ error: 'Falha ao salvar a inscrição.' })
      return
    }
    res.status(201).json({ ok: true })
  } catch (e) {
    console.error('[subscribe] erro:', e)
    res.status(500).json({ error: 'Falha ao salvar a inscrição.' })
  }
}
