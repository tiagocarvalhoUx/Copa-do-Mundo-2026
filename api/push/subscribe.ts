/**
 * POST /api/push/subscribe — recebe a subscription do navegador e a persiste.
 *
 * O cliente (src/services/pushNotifications.ts) chama isto ao ativar os alertas.
 * O corpo é o objeto PushSubscription serializado (endpoint + keys).
 *
 * ⚠️ A persistência usa o store de EXEMPLO (em memória). Em produção/Vercel,
 * funções serverless NÃO mantêm estado entre invocações — troque o store por um
 * banco real (veja server/push/subscriptionsStore.example.ts). Como você já tem
 * um backend contínuo, o ideal é apontar VITE_PUSH_API_URL para ELE e salvar lá.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import type { PushSubscription } from 'web-push'
import { saveSubscription } from '../../server/push/subscriptionsStore.example'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Método não permitido.' })
    return
  }

  const sub = req.body as PushSubscription | undefined
  if (!sub || !sub.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    res.status(400).json({ error: 'Subscription inválida.' })
    return
  }

  try {
    await saveSubscription(sub)
    res.status(201).json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Falha ao salvar a inscrição.' })
  }
}
