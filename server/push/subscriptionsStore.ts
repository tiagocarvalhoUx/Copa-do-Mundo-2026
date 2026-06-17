/**
 * Armazenamento de subscriptions — persistente em arquivo JSON. 📦
 *
 * Roda no SEU servidor Node contínuo. Diferente da Vercel (serverless, sem
 * estado), aqui o processo fica vivo, então guardar em arquivo já funciona bem
 * para começar. Para escala/produção séria, troque por um banco (Postgres,
 * Supabase, Redis) — basta reimplementar as 3 funções mantendo a assinatura.
 *
 * Local do arquivo: env PUSH_STORE_FILE ou ./.push-subscriptions.json
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type { PushSubscription } from 'web-push'

const FILE = process.env.PUSH_STORE_FILE
  ? resolve(process.env.PUSH_STORE_FILE)
  : resolve(process.cwd(), '.push-subscriptions.json')

// Cache em memória (o processo é contínuo) + escrita em disco para sobreviver a restarts.
let cache: Map<string, PushSubscription> | null = null
let writing: Promise<void> = Promise.resolve()

async function load(): Promise<Map<string, PushSubscription>> {
  if (cache) return cache
  try {
    const raw = await readFile(FILE, 'utf8')
    const arr = JSON.parse(raw) as PushSubscription[]
    cache = new Map(arr.map((s) => [s.endpoint, s]))
  } catch {
    cache = new Map() // arquivo ainda não existe → começa vazio
  }
  return cache
}

async function flush(): Promise<void> {
  const map = await load()
  // Serializa as escritas para não corromper o arquivo sob concorrência.
  writing = writing.then(async () => {
    await mkdir(dirname(FILE), { recursive: true })
    await writeFile(FILE, JSON.stringify([...map.values()], null, 2), 'utf8')
  })
  return writing
}

/** Salva (ou atualiza) uma subscription. */
export async function saveSubscription(sub: PushSubscription): Promise<void> {
  const map = await load()
  map.set(sub.endpoint, sub)
  await flush()
}

/** Remove uma subscription pelo endpoint. */
export async function removeSubscription(endpoint: string): Promise<void> {
  const map = await load()
  if (map.delete(endpoint)) await flush()
}

/** Lista todas as subscriptions ativas (lido pelo disparo de gol). */
export async function getAllSubscriptions(): Promise<PushSubscription[]> {
  const map = await load()
  return [...map.values()]
}
