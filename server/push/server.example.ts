/**
 * Servidor de exemplo (Express) — junta tudo para você TESTAR o push de ponta a
 * ponta no seu servidor Node contínuo. ⚽
 *
 * Rode com:
 *   npm i express cors web-push
 *   # defina as variáveis VAPID_* no ambiente (veja .env.example)
 *   npx tsx server/push/server.example.ts      # ou compile com tsc/ts-node
 *
 * Rotas:
 *   POST /api/push/subscribe     ← o app registra a inscrição
 *   POST /api/push/unsubscribe   ← o app cancela
 *   POST /api/push/test-gol      ← dispara um gol de TESTE para todos os inscritos
 *
 * Na sua aplicação real, em vez de /test-gol, chame sendGoalNotification(...)
 * exatamente no ponto em que sua API detecta o gol.
 */
import express from 'express'
import { createPushRouter } from './pushRoutes'
import { sendGoalNotification } from './sendGoalNotification'

const app = express()
app.use(express.json())

// Origem do app autorizada (ajuste para o seu domínio de produção).
const ALLOWED_ORIGIN = process.env.APP_ORIGIN || 'https://copa-do-mundo-2026-puce.vercel.app'

app.use('/api/push', createPushRouter({ allowedOrigin: ALLOWED_ORIGIN }))

// Rota de TESTE: dispara um gol fictício para validar o pipeline.
app.post('/api/push/test-gol', async (_req, res) => {
  const resumo = await sendGoalNotification({
    matchId: 1,
    scoringTeam: 'Brasil',
    scoreline: 'Brasil 1 x 0 Argentina',
    minute: "23'",
    scorer: 'Vinícius Jr.',
  })
  res.json({ ok: true, ...resumo })
})

const PORT = Number(process.env.PORT || 3001)
app.listen(PORT, () => {
  console.log(`🟢 Push backend ouvindo em http://localhost:${PORT}`)
  console.log(`   Origem do app permitida (CORS): ${ALLOWED_ORIGIN}`)
})
