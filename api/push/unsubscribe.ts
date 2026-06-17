/**
 * POST /api/push/unsubscribe — remove a subscription do usuário do Supabase.
 * Corpo: { endpoint: string }.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabase, TBL_SUBSCRIPTIONS } from '../_lib/supabase'

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

  try {
    const supabase = getSupabase()
    const { error } = await supabase.from(TBL_SUBSCRIPTIONS).delete().eq('endpoint', endpoint)
    if (error) throw new Error(error.message)
    res.status(200).json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Falha ao remover a inscrição.' })
  }
}
