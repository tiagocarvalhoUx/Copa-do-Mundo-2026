/**
 * Armazenamento de subscriptions — EXEMPLO / ponto de integração. 📦
 *
 * Aqui é onde o seu backend guarda as inscrições push dos usuários. O disparo
 * (sendGoalNotification.ts) lê daqui, e os endpoints de subscribe/unsubscribe
 * escrevem aqui.
 *
 * ⚠️ A versão abaixo é EM MEMÓRIA (um Map) — serve só para teste local. Em
 * produção, troque o corpo destas funções pelo SEU banco. Como você já tem um
 * backend contínuo, é provável que já tenha uma tabela/coleção pronta.
 *
 * Esquema sugerido (SQL):
 *   CREATE TABLE push_subscriptions (
 *     endpoint   TEXT PRIMARY KEY,
 *     p256dh     TEXT NOT NULL,
 *     auth       TEXT NOT NULL,
 *     created_at TIMESTAMPTZ DEFAULT now()
 *   );
 */
import type { PushSubscription } from 'web-push'

// —— Implementação EM MEMÓRIA (apenas para testes) ————————————————————————
const store = new Map<string, PushSubscription>()

/** Salva (ou atualiza) uma subscription. Chamado pelo endpoint /subscribe. */
export async function saveSubscription(sub: PushSubscription): Promise<void> {
  store.set(sub.endpoint, sub)
  // Produção (exemplo com pg):
  //   await db.query(
  //     `INSERT INTO push_subscriptions (endpoint, p256dh, auth)
  //      VALUES ($1,$2,$3) ON CONFLICT (endpoint) DO UPDATE
  //      SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
  //     [sub.endpoint, sub.keys.p256dh, sub.keys.auth],
  //   )
}

/** Remove uma subscription. Chamado em /unsubscribe e ao detectar 404/410. */
export async function removeSubscription(endpoint: string): Promise<void> {
  store.delete(endpoint)
  // Produção:
  //   await db.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint])
}

/** Lista todas as subscriptions ativas. Lido pelo disparo de gol. */
export async function getAllSubscriptions(): Promise<PushSubscription[]> {
  return [...store.values()]
  // Produção:
  //   const { rows } = await db.query('SELECT endpoint, p256dh, auth FROM push_subscriptions')
  //   return rows.map((r) => ({
  //     endpoint: r.endpoint,
  //     keys: { p256dh: r.p256dh, auth: r.auth },
  //   }))
}
