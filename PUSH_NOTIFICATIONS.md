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
| `server/push/pushRoutes.ts` | **Router Express** (`/subscribe`, `/unsubscribe`) p/ montar no seu backend |
| `server/push/sendGoalNotification.ts` | **O disparo** — chame no seu backend ao detectar o gol |
| `server/push/subscriptionsStore.ts` | Persistência das subscriptions (arquivo JSON; trocável por banco) |
| `server/push/server.example.ts` | Servidor Express completo de exemplo (pra testar de ponta a ponta) |
| `scripts/generate-vapid-keys.mjs` | Gera o par de chaves VAPID |
| `api/push/*.ts` (Vercel) | **Opcional** — só se quiser que a Vercel encaminhe ao backend (`PUSH_BACKEND_URL`); nesta arquitetura o app fala direto com o seu backend |

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

### 4. Monte as rotas no seu backend Node (arquitetura escolhida)
O app envia a inscrição **direto para o seu servidor contínuo**, que guarda e
dispara. Copie a pasta `server/push/` para o seu backend e monte o router:

```ts
import express from 'express'
import { createPushRouter } from './push/pushRoutes'

const app = express()
app.use(express.json())
app.use('/api/push', createPushRouter({
  allowedOrigin: 'https://copa-do-mundo-2026-puce.vercel.app', // origem do app (CORS)
}))
```

Instale as dependências no backend: `npm i express cors web-push`.
No front, aponte para ele: `VITE_PUSH_API_URL=https://SEU-BACKEND/api/push`.

> Persistência: `subscriptionsStore.ts` salva num arquivo JSON (sobrevive a
> restarts). Para banco (Postgres/Supabase/Redis), reimplemente as 3 funções
> mantendo as assinaturas — `sendGoalNotification` lê de `getAllSubscriptions()`.

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

## Testando de ponta a ponta

Use o servidor de exemplo, que já tem uma rota de gol de teste:

```bash
npm i express cors web-push tsx
# defina VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY / VAPID_SUBJECT no ambiente
npx tsx server/push/server.example.ts   # sobe em http://localhost:3001
```

1. No front, defina `VITE_PUSH_API_URL=http://localhost:3001/api/push` e rode `npm run dev`.
2. Abra o app, clique em "Avise-me dos gols" e aceite a permissão (a inscrição
   vai para o backend e fica salva em `.push-subscriptions.json`).
3. Dispare o gol de teste e veja a notificação aparecer (mesmo com a aba fechada):
   ```bash
   curl -X POST http://localhost:3001/api/push/test-gol
   ```

> Dica: no Chrome, `DevTools → Application → Service Workers` também permite
> inspecionar o `sw.js` e enviar um "Push" de teste manualmente.

## Notas de compatibilidade

- **iOS/iPhone:** só funciona com o PWA **instalado** na tela inicial (iOS 16.4+).
- **Ícone:** `icon-gol.svg` é vetorial e leve. Se em algum Android o ícone não
  renderizar, exporte uma versão PNG 192×192 e troque `icon`/`badge` no `sw.js`.
- **HTTPS:** push só funciona em HTTPS (ou `localhost`). Na Vercel já é HTTPS.
