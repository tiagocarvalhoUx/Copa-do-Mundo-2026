/**
 * POST /api/push/subscribe — recebe a subscription do navegador.
 *
 * ⚠️ AUTOSSUFICIENTE de propósito: na Vercel, com "type": "module" no
 * package.json, importar de fora da pasta /api (ex.: ../../server/...) quebra em
 * runtime. Por isso a validação fica aqui dentro, sem imports locais.
 *
 * ⚠️ PERSISTÊNCIA: funções serverless NÃO mantêm estado entre invocações. Este
 * handler apenas VALIDA e recebe — para o push funcionar de verdade, a
 * subscription precisa ser GRAVADA num armazenamento que o seu backend (o que
 * dispara o gol) consiga ler. Veja `persistSubscription` abaixo.
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

  // req.body pode chegar como string (dependendo do Content-Type) — normaliza.
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
    await persistSubscription(sub)
    res.status(201).json({ ok: true })
  } catch {
    res.status(500).json({ error: 'Falha ao salvar a inscrição.' })
  }
}

/**
 * 👉 PONTO DE INTEGRAÇÃO: grave a subscription onde o seu backend a leia.
 *
 * Opções:
 *  - Encaminhar para o SEU backend (recomendado, pois é ele quem dispara):
 *      await fetch(`${process.env.PUSH_BACKEND_URL}/subscribe`, { method:'POST', body: JSON.stringify(sub) })
 *  - Gravar num banco (Postgres/Supabase/Vercel KV) que o backend também acessa.
 *
 * Enquanto não estiver ligado, apenas registra no log (não persiste!).
 */
async function persistSubscription(sub: PushSubscriptionJSON): Promise<void> {
  const backend = process.env.PUSH_BACKEND_URL
  if (backend) {
    const r = await fetch(`${backend.replace(/\/$/, '')}/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub),
    })
    if (!r.ok) throw new Error(`backend respondeu ${r.status}`)
    return
  }
  // TODO: trocar por gravação real. Por ora só loga (Vercel → Runtime Logs).
  console.log('[push] subscription recebida (NÃO persistida):', sub.endpoint)
}
