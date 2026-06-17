/**
 * POST/GET /api/push/test-goal — dispara um GOL de TESTE para todos os inscritos.
 *
 * Serve para validar o pipeline de ponta a ponta sem esperar um jogo real.
 * Protegido pelo mesmo CRON_SECRET (em ?secret=... ou Authorization: Bearer).
 *
 *   curl -X POST "https://SEU-APP.vercel.app/api/push/test-goal?secret=SEU_SEGREDO"
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sendGoalNotification } from '../_lib/webpush'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    res.status(500).json({ error: 'CRON_SECRET não configurada no servidor.' })
    return
  }
  const provided =
    (typeof req.query.secret === 'string' ? req.query.secret : '') ||
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (provided !== secret) {
    res.status(401).json({ error: 'Não autorizado.' })
    return
  }

  try {
    const resumo = await sendGoalNotification({
      matchId: 0,
      scoringTeam: 'Brasil',
      scoreline: 'Brasil 1 x 0 Argentina (teste)',
      minute: "23'",
      scorer: 'Vinícius Jr.',
    })
    res.status(200).json({ ok: true, ...resumo })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Falha no disparo de teste.' })
  }
}
