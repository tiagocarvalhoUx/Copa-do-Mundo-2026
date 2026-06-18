/**
 * Service Worker — Notificações de Gol (Web Push) ⚽
 *
 * Roda em segundo plano no navegador do usuário, MESMO COM O APP FECHADO.
 * Quando o seu backend dispara um push (via Web Push / VAPID), o navegador
 * "acorda" este worker e ele exibe a notificação com o ícone da bola.
 *
 * Fluxo:
 *   backend detecta o gol → envia push p/ a subscription do usuário
 *     → navegador entrega aqui no evento 'push'
 *       → self.registration.showNotification(...) mostra a bola 🥅
 *
 * O payload esperado (JSON) que o backend deve mandar está em
 * server/push/sendGoalNotification.ts.
 */

// Garante que o SW assuma o controle assim que ativar (sem precisar recarregar).
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

/**
 * Push recebido: monta e exibe a notificação do gol.
 */
self.addEventListener('push', (event) => {
  // Payload tolerante a falhas: se vier vazio/quebrado, usa um texto genérico.
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch {
    data = { title: 'GOL na Copa! ⚽', body: event.data && event.data.text() }
  }

  const title = data.title || 'GOOOL! ⚽'
  const options = {
    body: data.body || 'Saiu gol em um jogo ao vivo.',
    // Ícone grande da notificação — a bola de futebol.
    // PNG (não SVG): o Chrome no Android NÃO renderiza ícones SVG em notificações.
    icon: data.icon || '/icone-bola.png',
    // Badge: ícone pequeno (Android, na barra de status).
    badge: data.badge || '/icone-bola.png',
    // Vibração curta dupla (celular) — dá aquela emoção de gol.
    vibrate: [120, 60, 120],
    // Tag por jogo: um novo gol no MESMO jogo substitui a notificação anterior
    // em vez de empilhar várias. Use o id do jogo como tag.
    tag: data.tag || (data.matchId ? `gol-${data.matchId}` : 'gol-copa'),
    renotify: true,
    // 'data' fica disponível no clique (para abrir a tela certa do jogo).
    data: {
      url: data.url || '/resultados',
      ...data,
    },
    // Ações opcionais nos botões da notificação.
    actions: [{ action: 'abrir', title: 'Ver o jogo' }],
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

/**
 * Clique na notificação: foca uma aba já aberta do app ou abre uma nova,
 * navegando direto para a tela do jogo.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const targetUrl = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se o app já estiver aberto, foca e navega nele.
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus()
          if ('navigate' in client) client.navigate(targetUrl).catch(() => {})
          return
        }
      }
      // Senão, abre uma nova janela já na tela do jogo.
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
    }),
  )
})

/**
 * (Opcional) Se a subscription expirar/for trocada pelo navegador, reenviar
 * a nova subscription ao backend para não perder o usuário.
 */
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const sub = await self.registration.pushManager.subscribe(
          event.oldSubscription
            ? event.oldSubscription.options
            : { userVisibleOnly: true },
        )
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sub),
        })
      } catch {
        // Silencioso: o usuário pode reativar pelo app na próxima visita.
      }
    })(),
  )
})
