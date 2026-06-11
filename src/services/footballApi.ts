/**
 * Fachada tipada de acesso a dados de futebol.
 *
 * Responsabilidades:
 *  - Centralizar TODO o acesso a dados (nenhum componente Vue chama a API direto).
 *  - Escolher a fonte: API real (`apiFootball`) quando há chave, ou dados mock locais.
 *  - Cachear dados pouco voláteis (ver `cache.ts`).
 *  - Tratar erros e devolver mensagens amigáveis em PT-BR.
 *
 * Estratégia de dados:
 *  - DADOS AO VIVO (jogos, placares, classificação, artilheiros): API real quando
 *    `VITE_USE_MOCK=false` e há `VITE_FOOTBALL_API_KEY`; senão, mock local.
 *  - METADADOS CURADOS (seleções, estádios, chaves): sempre da base local — emoji
 *    de bandeira, nome em PT-BR, técnico e grupo são curados manualmente. O cliente
 *    real casa os dados ao vivo com estes metadados por nome/código.
 */
import type {
  BracketRound,
  Country,
  GroupStanding,
  Match,
  PlayerStat,
  Stadium,
  StatCategory,
} from '@/types'
import { countries } from '@/data/countries'
import { stadiums } from '@/data/stadiums'
import { matches } from '@/data/matches'
import { standings } from '@/data/standings'
import { playerStats } from '@/data/playerStats'
import { bracket } from '@/data/bracket'
import { cached, TTL } from './cache'
import { apiFootball, ApiFootballError } from './apiFootball'

const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY ?? ''
/** Usa mock a menos que explicitamente desligado E exista chave. */
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false' || !API_KEY

/** Erro padronizado, sempre com mensagem amigável em português. */
export class ApiError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

/** Normaliza qualquer erro do cliente real para o ApiError do app. */
function toAppError(err: unknown): ApiError {
  if (err instanceof ApiFootballError) return new ApiError(err.message, err.code)
  if (err instanceof ApiError) return err
  return new ApiError('Ocorreu um erro ao carregar os dados. Tente novamente.', 'unknown')
}

/** Simula latência de rede no modo mock para exercitar loading states. */
function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

// ──────────────────────────────────────────────────────────────────────────
// API pública do serviço
// ──────────────────────────────────────────────────────────────────────────

export const footballApi = {
  /** Seleções participantes (metadados curados — sempre local). */
  async getCountries(): Promise<Country[]> {
    return cached('countries', TTL.static, () => delay(countries))
  },

  async getCountry(id: number): Promise<Country> {
    const found = (await this.getCountries()).find((c) => c.id === id)
    if (!found) throw new ApiError('Seleção não encontrada.', 'not-found')
    return found
  },

  /** Estádios-sede (metadados curados — sempre local). */
  async getStadiums(): Promise<Stadium[]> {
    return cached('stadiums', TTL.static, () => delay(stadiums))
  },

  async getStadium(id: number): Promise<Stadium> {
    const found = (await this.getStadiums()).find((s) => s.id === id)
    if (!found) throw new ApiError('Estádio não encontrado.', 'not-found')
    return found
  },

  /** Todos os jogos (passados, ao vivo e futuros). */
  async getMatches(): Promise<Match[]> {
    return cached('matches', TTL.matches, async () => {
      if (USE_MOCK) return delay([...matches].sort((a, b) => +new Date(a.date) - +new Date(b.date)))
      try {
        return await apiFootball.getMatches()
      } catch (err) {
        throw toAppError(err)
      }
    })
  },

  /** Jogos ao vivo. */
  async getLiveMatches(): Promise<Match[]> {
    const all = await this.getMatches()
    return all.filter((m) => m.status === 'ao-vivo' || m.status === 'intervalo')
  },

  /** Um jogo por id, com detalhes. */
  async getMatch(id: number): Promise<Match> {
    if (USE_MOCK) {
      const found = matches.find((m) => m.id === id)
      if (!found) throw new ApiError('Jogo não encontrado.', 'not-found')
      return delay(found, 250)
    }
    const found = (await this.getMatches()).find((m) => m.id === id)
    if (!found) throw new ApiError('Jogo não encontrado.', 'not-found')
    return found
  },

  /** Classificação dos grupos. */
  async getStandings(): Promise<GroupStanding[]> {
    return cached('standings', USE_MOCK ? TTL.static : TTL.matches, async () => {
      if (USE_MOCK) return delay(standings)
      try {
        return await apiFootball.getStandings()
      } catch (err) {
        throw toAppError(err)
      }
    })
  },

  /** Chaveamento do mata-mata (estrutura curada — local). */
  async getBracket(): Promise<BracketRound[]> {
    return cached('bracket', TTL.static, () => delay(bracket))
  },

  /** Ranking de jogadores por categoria. */
  async getPlayerStats(category: StatCategory): Promise<PlayerStat[]> {
    return cached(`stats:${category}`, USE_MOCK ? TTL.static : TTL.matches, async () => {
      if (USE_MOCK) return delay(playerStats[category])
      try {
        return await apiFootball.getPlayerStats(category)
      } catch (err) {
        throw toAppError(err)
      }
    })
  },
}

export { USE_MOCK }
