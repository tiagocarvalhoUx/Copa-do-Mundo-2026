/**
 * POST /api/push/subscribe — grava a subscription do navegador no Supabase.
 *
 * O cliente (src/services/pushNotifications.ts) chama isto ao ativar os alertas.
 * Corpo: objeto PushSubscription serializado (endpoint + keys).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase, TBL_SUBSCRIPTIONS } from '../_lib/supabase'

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

  try {
    const supabase = getSupabase()
    // upsert por endpoint: reativar/atualizar não duplica.
    const { error } = await supabase.from(TBL_SUBSCRIPTIONS).upsert(
      {
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        user_agent: typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'] : null,
      },
      { onConflict: 'endpoint' },
    )
    if (error) throw new Error(error.message)
    res.status(201).json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Falha ao salvar a inscrição.' })
  }
}
