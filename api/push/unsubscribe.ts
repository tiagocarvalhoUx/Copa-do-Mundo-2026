/**
 * POST /api/push/unsubscribe — remove a subscription do usuário.
 *
 * Autossuficiente (sem imports locais) pelos mesmos motivos de subscribe.ts.
 * Corpo: { endpoint: string }.
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

  try {
    await removeSubscription(endpoint)
    res.status(200).json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Falha ao remover a inscrição.' })
  }
}

/** 👉 PONTO DE INTEGRAÇÃO: remova do mesmo lugar onde subscribe.ts grava. */
async function removeSubscription(endpoint: string): Promise<void> {
  const backend = process.env.PUSH_BACKEND_URL
  if (backend) {
    const r = await fetch(`${backend.replace(/\/$/, '')}/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint }),
    })
    if (!r.ok) throw new Error(`backend respondeu ${r.status}`)
    return
  }
  console.log('[push] unsubscribe recebido (NÃO persistido):', endpoint)
}
