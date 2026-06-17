# ⚽ Notificações de Gol em Tempo Real (Web Push)

Notifica o usuário no celular **mesmo com o app fechado** quando sai um gol —
com ícone de bola de futebol. Funciona no Android (Chrome/Edge/Firefox) e no
iPhone a partir do **iOS 16.4**, *se* o usuário instalar o app na tela inicial
(PWA "Adicionar à Tela de Início").

## Arquitetura (tudo na Vercel + Supabase + cron externo)

```
[Cron externo a cada 1 min]  (cron-job.org)
        │ chama
        ▼
[/api/cron/check-goals]  ── busca jogos ao vivo (football-data.org)
        │                   compara com o último placar salvo (Supabase)
        │ achou gol?
        ▼
[/api/_lib/webpush]  ── lê inscrições (Supabase) e envia o push (VAPID)
        ▼
[Service Worker do usuário]  public/sw.js
        ▼
[Notificação com ícone de bola ⚽]  ← mesmo com o app fechado
```

> **Por que cron externo?** A Vercel é serverless: não tem processo "sempre
> ligado" para vigiar os jogos, e no plano Hobby os Vercel Cron só rodam 1x/dia.
> Por isso um serviço grátis (cron-job.org) chama a função a cada minuto.

## Peças

| Arquivo | Papel |
|---|---|
| `public/sw.js` | Service Worker: recebe o push e mostra a notificação |
| `public/icon-gol.svg` | Ícone da bola de futebol |
| `src/services/pushNotifications.ts` | Cliente: permissão + inscrição (posta em `/api/push`) |
| `src/composables/useGoalNotifications.ts` | Estado reativo para a UI |
| `src/components/ui/GoalAlertButton.vue` | Botão "Avise-me dos gols" (na Home) |
| `api/push/subscribe.ts` · `unsubscribe.ts` | Gravam/removem a inscrição no Supabase |
| `api/cron/check-goals.ts` | **O vigia**: detecta o gol e dispara (chamado pelo cron) |
| `api/push/test-goal.ts` | Dispara um gol de TESTE para validar o pipeline |
| `api/_lib/supabase.ts` · `webpush.ts` | Cliente Supabase + envio de push (compartilhados) |
| `scripts/generate-vapid-keys.mjs` | Gera o par de chaves VAPID |

**Banco (Supabase, projeto `chaveiro-concordia`, tabelas isoladas):**
- `copa_push_subscriptions` — inscrições push dos usuários
- `copa_match_scores` — último placar conhecido por jogo (para detectar o gol)

## Configuração (uma vez)

### 1. Gere as chaves VAPID
```bash
cd frontend && npm install && npm run vapid:keys
```

### 2. Variáveis de ambiente na Vercel (Settings → Environment Variables)

| Variável | Escopo | Valor |
|---|---|---|
| `VITE_VAPID_PUBLIC_KEY` | cliente | chave pública gerada |
| `VAPID_PUBLIC_KEY` | servidor | mesma pública |
| `VAPID_PRIVATE_KEY` | servidor | **secreta** |
| `VAPID_SUBJECT` | servidor | `mailto:seu-email@dominio.com` |
| `SUPABASE_URL` | servidor | `https://xzfpvmquhunxipbllicu.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor | Supabase → Project Settings → API → `service_role` |
| `CRON_SECRET` | servidor | um texto secreto qualquer |
| `FOOTBALLDATA_KEY` | servidor | já configurada (dados ao vivo) |

> Depois de salvar as variáveis, **faça um novo deploy** (a Vercel só aplica em builds novos).

### 3. Ligue o cron externo (cron-job.org)
1. Crie conta grátis em **https://cron-job.org**.
2. Novo cronjob:
   - **URL:** `https://copa-do-mundo-2026-puce.vercel.app/api/cron/check-goals?secret=SEU_CRON_SECRET`
   - **Schedule:** a cada 1 minuto (`* * * * *`).
   - Método GET.
3. Salve. Pronto — a cada minuto ele checa os jogos e dispara os gols.

## Testando

**a) O pipeline de push (sem esperar jogo):**
```bash
# 1. abra o site, clique em "Avise-me dos gols" e aceite a permissão
# 2. dispare o gol de teste:
curl -X POST "https://copa-do-mundo-2026-puce.vercel.app/api/push/test-goal?secret=SEU_CRON_SECRET"
```
A notificação "GOOOL do Brasil! ⚽ (teste)" deve aparecer — mesmo com a aba fechada.

**b) O vigia de gols:**
```bash
curl "https://copa-do-mundo-2026-puce.vercel.app/api/cron/check-goals?secret=SEU_CRON_SECRET"
# → {"ok":true,"aoVivo":N,"gols":M,...}
```

> Dica: no Chrome, `DevTools → Application → Service Workers` permite inspecionar
> o `sw.js` e enviar um "Push" de teste manualmente.

## Notas

- **iOS/iPhone:** só funciona com o PWA **instalado** na tela inicial (iOS 16.4+).
- **Nomes das seleções** na notificação saem em inglês (vêm direto da football-data);
  dá para mapear para PT-BR depois, se quiser.
- **Ícone:** `icon-gol.svg` é vetorial e leve. Se em algum Android não renderizar,
  exporte um PNG 192×192 e troque `icon`/`badge` no `sw.js`.
- **Primeiro contato com um jogo:** o vigia só cria a linha-base do placar e
  **não** notifica (evita "gol fantasma" de jogos que já estavam rolando).
- **HTTPS:** push só funciona em HTTPS (ou `localhost`). Na Vercel já é HTTPS.
