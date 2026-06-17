/**
 * Gera o par de chaves VAPID (uma vez só) para o Web Push.
 *
 * Uso:
 *   npm i web-push
 *   node scripts/generate-vapid-keys.mjs
 *
 * Saída: cole a PÚBLICA no front (VITE_VAPID_PUBLIC_KEY) e guarde a PRIVADA
 * SOMENTE no backend (VAPID_PRIVATE_KEY) — nunca no bundle do cliente.
 */
import webpush from 'web-push'

const { publicKey, privateKey } = webpush.generateVAPIDKeys()

console.log('\n🔑 Chaves VAPID geradas — adicione ao seu ambiente:\n')
console.log('# Frontend (.env) — PODE ir ao cliente:')
console.log(`VITE_VAPID_PUBLIC_KEY=${publicKey}\n`)
console.log('# Backend (variáveis de servidor) — NUNCA exponha a privada:')
console.log(`VAPID_PUBLIC_KEY=${publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${privateKey}`)
console.log('VAPID_SUBJECT=mailto:contato@seudominio.com\n')
