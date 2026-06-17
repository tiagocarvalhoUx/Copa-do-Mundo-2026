/**
 * Serviço de Notificações Push (Web Push) — lado do cliente (navegador). ⚽
 *
 * Responsável por: registrar o Service Worker, pedir permissão ao usuário,
 * criar a "subscription" (assinatura push) e enviá-la ao backend. É o backend
 * quem, ao detectar um gol, dispara o push para essas subscriptions.
 *
 * Suporte: Android/Chrome, Edge, Firefox e — no iPhone — a partir do iOS 16.4
 * SOMENTE quando o app é instalado na tela inicial (PWA "standalone").
 */

// Chave PÚBLICA VAPID — pode ir para o bundle do cliente (a privada NÃO!).
// Gere o par com: node scripts/generate-vapid-keys.mjs  (veja PUSH_NOTIFICATIONS.md)
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

// Endpoint do backend que ARMAZENA a subscription (ajuste se o seu backend
// estiver em outro domínio: defina VITE_PUSH_API_URL no .env).
const PUSH_API_URL = (import.meta.env.VITE_PUSH_API_URL as string | undefined) || '/api/push'

const SW_URL = '/sw.js'

/** O navegador suporta o pipeline completo de Web Push? */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** Estado atual da permissão de notificações. */
export function getPermission(): NotificationPermission {
  return isPushSupported() ? Notification.permission : 'denied'
}

/** Registra (ou recupera) o Service Worker e espera ele ficar pronto. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  const registration = await navigator.serviceWorker.register(SW_URL, { scope: '/' })
  await navigator.serviceWorker.ready
  return registration
}

/** O usuário já está inscrito para receber alertas de gol? */
export async function getActiveSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

/**
 * Ativa os alertas de gol: pede permissão, inscreve e envia a subscription ao
 * backend. Retorna a subscription criada.
 *
 * Lança um Error com mensagem amigável (em PT-BR) se algo falhar — trate na UI.
 */
export async function enableGoalAlerts(): Promise<PushSubscription> {
  if (!isPushSupported()) {
    throw new Error('Seu navegador não suporta notificações push.')
  }
  if (!VAPID_PUBLIC_KEY) {
    throw new Error('Notificações não configuradas (chave VAPID ausente).')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Permissão de notificação negada. Ative nas configurações do navegador.')
  }

  const registration = await registerServiceWorker()

  // Reaproveita uma assinatura existente, se houver.
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true, // exigido: todo push deve gerar uma notificação visível
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  await sendSubscriptionToBackend(subscription)
  return subscription
}

/** Desativa os alertas: cancela a assinatura local e avisa o backend. */
export async function disableGoalAlerts(): Promise<void> {
  const subscription = await getActiveSubscription()
  if (!subscription) return

  // Avisa o backend ANTES de cancelar (ainda temos o endpoint para identificar).
  try {
    await fetch(`${PUSH_API_URL}/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: subscription.endpoint }),
    })
  } catch {
    // Mesmo que o backend falhe, cancelamos localmente abaixo.
  }

  await subscription.unsubscribe()
}

/** Envia a subscription para o backend persistir. */
async function sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
  const response = await fetch(`${PUSH_API_URL}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  })
  if (!response.ok) {
    throw new Error('Não foi possível salvar sua inscrição. Tente novamente.')
  }
}

/**
 * Converte a chave VAPID pública (Base64 URL-safe) para o Uint8Array que a
 * Push API exige em `applicationServerKey`.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  // ArrayBuffer explícito: garante o tipo BufferSource exigido por subscribe().
  const outputArray = new Uint8Array(new ArrayBuffer(rawData.length))
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
