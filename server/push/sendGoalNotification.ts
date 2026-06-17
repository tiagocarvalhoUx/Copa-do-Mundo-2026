/**
 * Disparo de notificação de GOL (lado do servidor). ⚽
 *
 * Este é o "disparo" que você pediu: chame `sendGoalNotification(...)` no SEU
 * backend, no exato momento em que sua API detectar que saiu o gol.
 *
 * Ele envia um Web Push (autenticado por VAPID) para TODAS as subscriptions
 * salvas. O navegador de cada usuário entrega ao Service Worker (public/sw.js),
 * que então mostra a notificação com o ícone da bola — mesmo com o app fechado.
 *
 * Pré-requisitos:
 *   npm i web-push
 *   Variáveis de ambiente no servidor:
 *     VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...)
 *
 * Persistência: implemente `getAllSubscriptions` / `removeSubscription` para ler
 * e limpar suas subscriptions (veja server/push/subscriptionsStore.example.ts).
 */
import webpush, { type PushSubscription } from 'web-push'
import {
  getAllSubscriptions,
  removeSubscription,
} from './subscriptionsStore.example'

let configured = false

/** Configura o VAPID uma única vez (idempotente). */
function ensureConfigured(): void {
  if (configured) return
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    throw new Error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY não configuradas no servidor.')
  }
  webpush.setVapidDetails(
    VAPID_SUBJECT || 'mailto:contato@seudominio.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  )
  configured = true
}

/** Dados do gol para montar a notificação. */
export interface GoalEvent {
  /** Id do jogo — usado p/ abrir /jogo/:id e agrupar notificações do mesmo jogo. */
  matchId: string | number
  /** Seleção que marcou (ex.: "Brasil"). */
  scoringTeam: string
  /** Placar atualizado (ex.: "Brasil 1 x 0 Argentina"). */
  scoreline: string
  /** Minuto do gol (ex.: "23'"). Opcional. */
  minute?: string
  /** Autor do gol. Opcional. */
  scorer?: string
}

/** Monta o payload (JSON) que o Service Worker (public/sw.js) espera. */
function buildPayload(goal: GoalEvent): string {
  const titulo = `GOOOL do ${goal.scoringTeam}! ⚽`
  const partes = [goal.scoreline]
  if (goal.scorer) partes.push(`⚽ ${goal.scorer}`)
  if (goal.minute) partes.push(goal.minute)

  return JSON.stringify({
    title: titulo,
    body: partes.join('  ·  '),
    icon: '/icon-gol.svg',
    badge: '/icon-gol.svg',
    matchId: goal.matchId,
    url: `/jogo/${goal.matchId}`,
    tag: `gol-${goal.matchId}`,
  })
}

/**
 * Dispara a notificação de gol para todos os inscritos.
 * Retorna um resumo {enviadas, removidas, falhas}.
 *
 * Exemplo de uso no seu detector de gols:
 *   if (golDetectado) {
 *     await sendGoalNotification({
 *       matchId: jogo.id,
 *       scoringTeam: 'Brasil',
 *       scoreline: 'Brasil 1 x 0 Argentina',
 *       minute: "23'",
 *       scorer: 'Vinícius Jr.',
 *     })
 *   }
 */
export async function sendGoalNotification(
  goal: GoalEvent,
): Promise<{ enviadas: number; removidas: number; falhas: number }> {
  ensureConfigured()

  const payload = buildPayload(goal)
  const subscriptions = await getAllSubscriptions()

  let enviadas = 0
  let removidas = 0
  let falhas = 0

  // Envia em paralelo; trata expiração de subscriptions (404/410 → remover).
  await Promise.all(
    subscriptions.map(async (sub: PushSubscription) => {
      try {
        await webpush.sendNotification(sub, payload, { TTL: 120 }) // gol é efêmero: TTL curto
        enviadas++
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          // Subscription morta (usuário desinstalou / revogou): limpe da base.
          await removeSubscription(sub.endpoint)
          removidas++
        } else {
          falhas++
        }
      }
    }),
  )

  return { enviadas, removidas, falhas }
}
