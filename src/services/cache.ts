/**
 * Cache em memória simples com TTL (time-to-live).
 *
 * Reduz chamadas à API para dados menos voláteis (estádios, países,
 * estatísticas históricas) conforme as regras de integração do projeto.
 */
interface Entry<T> {
  value: T
  expiresAt: number
}

const store = new Map<string, Entry<unknown>>()

/** TTLs padrão por tipo de dado (em milissegundos). */
export const TTL = {
  /** Detalhe de UM jogo ao vivo (placar + eventos): atualização quase imediata. */
  liveFast: 5_000,
  /** Dados ao vivo: cache curtíssimo. */
  live: 10_000,
  /** Jogos / resultados. */
  matches: 30_000,
  /** Dados pouco voláteis (estádios, países, classificação). */
  static: 5 * 60_000,
} as const

/**
 * Retorna o valor cacheado para `key` ou executa `loader` e o armazena.
 * @param ttl tempo de vida em ms.
 */
export async function cached<T>(key: string, ttl: number, loader: () => Promise<T>): Promise<T> {
  const hit = store.get(key)
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as T
  }
  const value = await loader()
  store.set(key, { value, expiresAt: Date.now() + ttl })
  return value
}

/** Invalida uma chave específica ou todo o cache. */
export function invalidate(key?: string): void {
  if (key) store.delete(key)
  else store.clear()
}
