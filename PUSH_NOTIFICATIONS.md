# ⚽ Notificações de Gol em Tempo Real (Web Push)

Notifica o usuário no celular **mesmo com o app fechado** quando sai um gol —
com ícone de bola de futebol. Funciona no Android (Chrome/Edge/Firefox) e no
iPhone a partir do **iOS 16.4**, *se* o usuário instalar o app na tela inicial
(PWA "Adicionar à Tela de Início").

## Como funciona (visão geral)

```
[Seu backend detecta o gol]
        │  chama sendGoalNotification({...})
        ▼
[web-push envia o push (VAPID)] ──► servidor push do navegador (FCM/Mozilla/Apple)
        ▼
[Service Worker do usuário acorda]  public/sw.js
        ▼
[Notificação com ícone de bola ⚽]  ← mesmo com o app fechado
```

O navegador do usuário precisa estar **inscrito** antes. Por isso o app mostra um
botão "Avise-me dos gols" que cria a *subscription* e a envia ao backend.

## Peças deste projeto

| Arquivo | Papel |
|---|---|
| `public/sw.js` | Service Worker: recebe o push e mostra a notificação |
| `public/icon-gol.svg` | Ícone da bola de futebol |
| `src/services/pushNotifications.ts` | Cliente: permissão + inscrição + envio ao backend |
| `src/composables/useGoalNotifications.ts` | Estado reativo para a UI |
| `src/components/ui/GoalAlertButton.vue` | Botão pronto "Avise-me dos gols" |
| `api/push/subscribe.ts` · `unsubscribe.ts` | Endpoints que guardam/removem a subscription |
| `server/push/sendGoalNotification.ts` | **O disparo** — chame no seu backend ao detectar o gol |
| `server/push/subscriptionsStore.example.ts` | Onde as subscriptions são salvas (troque pelo seu banco) |
| `scripts/generate-vapid-keys.mjs` | Gera o par de chaves VAPID |

## Passo a passo

### 1. Instale a dependência e gere as chaves VAPID
```bash
cd frontend
npm install            # já inclui web-push
npm run vapid:keys     # imprime VITE_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / ...
```

### 2. Configure as variáveis de ambiente
No `.env` (frontend) e nas variáveis de servidor (Vercel → Settings → Environment
Variables ou no seu backend). Veja o bloco "Notificações de Gol" em `.env.example`.

| Variável | Onde | Observação |
|---|---|---|
| `VITE_VAPID_PUBLIC_KEY` | cliente | pode ir ao bundle |
| `VAPID_PUBLIC_KEY` | servidor | mesma pública |
| `VAPID_PRIVATE_KEY` | servidor | **secreta** |
| `VAPID_SUBJECT` | servidor | `mailto:contato@seudominio.com` |
| `VITE_PUSH_API_URL` | cliente (opcional) | se o backend que guarda as subs está em outro domínio |

### 3. Mostre o botão no app
Coloque onde fizer sentido (ex.: Home ou na tela do jogo):
```vue
<script setup lang="ts">
import GoalAlertButton from '@/components/ui/GoalAlertButton.vue'
</script>

<template>
  <GoalAlertButton />
</template>
```

### 4. Ligue a persistência (importante)
`server/push/subscriptionsStore.example.ts` vem com um store **em memória**, só
para testes. Funções serverless da Vercel **não** mantêm estado entre chamadas —
e o seu *disparo* roda num backend separado. Então:

- **Recomendado:** como você já tem um backend contínuo, salve as subscriptions
  **nele** (ex.: tabela `push_subscriptions`). Aponte `VITE_PUSH_API_URL` para o
  seu backend e implemente lá os endpoints `/subscribe` e `/unsubscribe` (use os
  de `api/push/*` como referência).
- O `sendGoalNotification` lê de `getAllSubscriptions()` — faça essa função ler
  do MESMO banco onde as subscriptions são gravadas.

### 5. Dispare o push quando sair o gol
No seu detector de gols (o backend que você já tem):
```ts
import { sendGoalNotification } from './server/push/sendGoalNotification'

if (golDetectado) {
  await sendGoalNotification({
    matchId: jogo.id,
    scoringTeam: 'Brasil',
    scoreline: 'Brasil 1 x 0 Argentina',
    minute: "23'",
    scorer: 'Vinícius Jr.',
  })
}
```

## Testando localmente

1. `npm run dev` e abra em **https** ou `http://localhost` (push exige contexto seguro).
2. Clique em "Avise-me dos gols" e aceite a permissão.
3. Com a subscription salva, chame `sendGoalNotification(...)` (ex.: num script
   Node apontando o store para o mesmo lugar) e veja a notificação aparecer.

> Dica: no Chrome, `DevTools → Application → Service Workers` permite inspecionar
> o `sw.js` e usar "Push" para simular um evento de push manualmente.

## Notas de compatibilidade

- **iOS/iPhone:** só funciona com o PWA **instalado** na tela inicial (iOS 16.4+).
- **Ícone:** `icon-gol.svg` é vetorial e leve. Se em algum Android o ícone não
  renderizar, exporte uma versão PNG 192×192 e troque `icon`/`badge` no `sw.js`.
- **HTTPS:** push só funciona em HTTPS (ou `localhost`). Na Vercel já é HTTPS.
