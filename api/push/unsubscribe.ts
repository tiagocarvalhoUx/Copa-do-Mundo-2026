/**
 * POST /api/push/unsubscribe — remove a subscription do Supabase (REST puro).
 * Corpo: { endpoint: string }. Autossuficiente (sem imports relativos).
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' })
    return
  }

  let endpoint: string | undefined
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    endpoint = body?.endpoint
  } catch {
    res.status(400).json({ error: 'JSON inválido.' })
    return
  }
  if (!endpoint) {
    res.status(400).json({ error: 'endpoint ausente.' })
    return
  }

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    res.status(500).json({ error: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configuradas.' })
    return
  }

  try {
    const r = await fetch(
      `${url}/rest/v1/copa_push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`,
      { method: 'DELETE', headers: { apikey: key, Authorization: `Bearer ${key}` } },
    )
    if (!r.ok) {
      console.error('[unsubscribe] Supabase respondeu', r.status, await r.text())
      res.status(500).json({ error: 'Falha ao remover a inscrição.' })
      return
    }
    res.status(200).json({ ok: true })
  } catch (e) {
    console.error('[unsubscribe] erro:', e)
    res.status(500).json({ error: 'Falha ao remover a inscrição.' })
  }
}
