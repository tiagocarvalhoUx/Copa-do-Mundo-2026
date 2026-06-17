/**
 * Disparo de Web Push (lado do servidor). ⚽
 *
 * Lê as inscrições no Supabase e envia a notificação de gol para todas. As que
 * estiverem mortas (404/410) são removidas automaticamente da base.
 *
 * Variáveis de ambiente:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:...)
 */
import webpush from 'web-push'
import { getSupabase, TBL_SUBSCRIPTIONS } from './supabase'

let configured = false

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

export interface GoalEvent {
  matchId: string | number
  scoringTeam: string
  scoreline: string
  minute?: string
  scorer?: string
}

interface SubscriptionRow {
  endpoint: string
  p256dh: string
  auth: string
}

function buildPayload(goal: GoalEvent): string {
  const partes = [goal.scoreline]
  if (goal.scorer) partes.push(`⚽ ${goal.scorer}`)
  if (goal.minute) partes.push(goal.minute)
  return JSON.stringify({
    title: `GOOOL do ${goal.scoringTeam}! ⚽`,
    body: partes.join('  ·  '),
    icon: '/icon-gol.svg',
    badge: '/icon-gol.svg',
    matchId: goal.matchId,
    url: `/jogo/${goal.matchId}`,
    tag: `gol-${goal.matchId}`,
  })
}

/** Dispara o gol para todos os inscritos. Retorna o resumo do envio. */
export async function sendGoalNotification(
  goal: GoalEvent,
): Promise<{ enviadas: number; removidas: number; falhas: number }> {
  ensureConfigured()
  const supabase = getSupabase()

  const { data, error } = await supabase
    .from(TBL_SUBSCRIPTIONS)
    .select('endpoint, p256dh, auth')
  if (error) throw new Error(`Falha ao ler inscrições: ${error.message}`)

  const subs = (data ?? []) as SubscriptionRow[]
  const payload = buildPayload(goal)

  let enviadas = 0
  let removidas = 0
  let falhas = 0
  const mortas: string[] = []

  await Promise.all(
    subs.map(async (row) => {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth },
      }
      try {
        await webpush.sendNotification(subscription, payload, { TTL: 120 })
        enviadas++
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number }).statusCode
        if (statusCode === 404 || statusCode === 410) {
          mortas.push(row.endpoint)
          removidas++
        } else {
          falhas++
        }
      }
    }),
  )

  // Limpa as inscrições mortas de uma vez.
  if (mortas.length) {
    await supabase.from(TBL_SUBSCRIPTIONS).delete().in('endpoint', mortas)
  }

  return { enviadas, removidas, falhas }
}
