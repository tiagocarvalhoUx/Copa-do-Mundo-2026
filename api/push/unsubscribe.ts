/**
 * POST /api/push/unsubscribe — remove a subscription do usuário.
 *
 * Corpo: { endpoint: string } — o endpoint identifica a assinatura a remover.
 * Chamado por src/services/pushNotifications.ts ao desativar os alertas.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { removeSubscription } from '../../server/push/subscriptionsStore.example'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' })
    return
  }

  const endpoint = (req.body as { endpoint?: string } | undefined)?.endpoint
  if (!endpoint) {
    res.status(400).json({ error: 'endpoint ausente.' })
    return
  }

  try {
    await removeSubscription(endpoint)
    res.status(200).json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Falha ao remover a inscrição.' })
  }
}
