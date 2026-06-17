/**
 * Rotas de Web Push para montar no SEU servidor Node/Express. 🔌
 *
 * O app (front) chama estas rotas para registrar/cancelar a inscrição do
 * usuário. Como o app está num domínio diferente do seu backend, o CORS precisa
 * permitir a origem do app — já tratado aqui via `allowedOrigin`.
 *
 * Como usar no seu servidor existente:
 *
 *   import express from 'express'
 *   import { createPushRouter } from './push/pushRoutes'
 *
 *   const app = express()
 *   app.use(express.json())
 *   app.use('/api/push', createPushRouter({
 *     allowedOrigin: 'https://copa-do-mundo-2026-puce.vercel.app',
 *   }))
 *
 * No front, aponte para o seu backend:  VITE_PUSH_API_URL=https://SEU-BACKEND/api/push
 *
 * Dependências no backend:  npm i express cors web-push
 */
import { Router, type Request, type Response } from 'express'
import cors from 'cors'
import { saveSubscription, removeSubscription } from './subscriptionsStore'

export interface PushRouterOptions {
  /** Origem do app autorizada a chamar (ex.: a URL da Vercel). Use '*' p/ liberar. */
  allowedOrigin: string | string[]
}

export function createPushRouter(options: PushRouterOptions): Router {
  const router = Router()

  // CORS: o app (outro domínio) precisa de permissão para chamar estas rotas.
  router.use(cors({ origin: options.allowedOrigin, methods: ['POST', 'OPTIONS'] }))

  // POST /subscribe — registra a inscrição enviada pelo navegador.
  router.post('/subscribe', async (req: Request, res: Response) => {
    const sub = req.body
    if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
      return res.status(400).json({ error: 'Subscription inválida.' })
    }
    try {
      await saveSubscription(sub)
      return res.status(201).json({ ok: true })
    } catch {
      return res.status(500).json({ error: 'Falha ao salvar a inscrição.' })
    }
  })

  // POST /unsubscribe — remove a inscrição.
  router.post('/unsubscribe', async (req: Request, res: Response) => {
    const endpoint = req.body?.endpoint
    if (!endpoint) return res.status(400).json({ error: 'endpoint ausente.' })
    try {
      await removeSubscription(endpoint)
      return res.status(200).json({ ok: true })
    } catch {
      return res.status(500).json({ error: 'Falha ao remover a inscrição.' })
    }
  })

  return router
}
