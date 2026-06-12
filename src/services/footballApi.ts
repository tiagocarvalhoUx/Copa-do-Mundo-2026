/**
 * Fachada tipada de acesso a dados de futebol.
 *
 * Seleciona a FONTE de dados via `VITE_DATA_PROVIDER`:
 *   - 'mock'        → dados locais curados (padrão; funciona sem internet/chave)
 *   - 'thesportsdb' → TheSportsDB (ao vivo, grátis; jogos + classificação calculada)
 *   - 'apifootball' → API-Football (requer chave e plano que cubra a temporada)
 *
 * Regras do projeto:
 *   - Nenhum componente Vue chama a API direto — tudo passa por aqui.
 *   - METADADOS curados (seleções, estádios, chaves) são sempre locais; os
 *     clientes ao vivo casam os dados por nome/código com esses metadados.
 *   - Erros sempre viram mensagens amigáveis em PT-BR.
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
import { theSportsDb, TheSportsDbError } from './theSportsDb'

type Provider = 'mock' | 'thesportsdb' | 'apifootball'
const PROVIDER = (import.meta.env.VITE_DATA_PROVIDER ?? 'mock') as Provider
const USE_MOCK = PROVIDER === 'mock'

/** Rótulo amigável da fonte de dados (usado no rodapé). */
export const DATA_SOURCE_LABEL =
  PROVIDER === 'thesportsdb'
    ? 'Dados ao vivo via TheSportsDB.'
    : PROVIDER === 'apifootball'
      ? 'Dados ao vivo via API-Football.'
      : 'Exibindo dados de demonstração. Conecte uma API para dados ao vivo.'

/** Erro padronizado, sempre com mensagem amigável em português. */
export class ApiError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

function toAppError(err: unknown): ApiError {
  if (err instanceof ApiFootballError || err instanceof TheSportsDbError) {
    return new ApiError(err.message, err.code)
  }
  if (err instanceof ApiError) return err
  return new ApiError('Ocorreu um erro ao carregar os dados. Tente novamente.', 'unknown')
}

/** Simula latência no modo mock para exercitar os loading states. */
function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

const liveTtl = USE_MOCK ? TTL.static : TTL.matches

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
    return cached('matches', liveTtl, async () => {
      try {
        if (PROVIDER === 'thesportsdb') return await theSportsDb.getMatches()
        if (PROVIDER === 'apifootball') return await apiFootball.getMatches()
        return await delay([...matches].sort((a, b) => +new Date(a.date) - +new Date(b.date)))
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

  /** Um jogo por id. No modo ao vivo, busca na lista (cacheada). */
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
    return cached('standings', liveTtl, async () => {
      try {
        if (PROVIDER === 'thesportsdb') return await theSportsDb.getStandings()
        if (PROVIDER === 'apifootball') return await apiFootball.getStandings()
        return await delay(standings)
      } catch (err) {
        throw toAppError(err)
      }
    })
  },

  /** Chaveamento do mata-mata (estrutura curada — sempre local). */
  async getBracket(): Promise<BracketRound[]> {
    return cached('bracket', TTL.static, () => delay(bracket))
  },

  /** Ranking de jogadores por categoria. */
  async getPlayerStats(category: StatCategory): Promise<PlayerStat[]> {
    return cached(`stats:${category}`, liveTtl, async () => {
      try {
        if (PROVIDER === 'apifootball') return await apiFootball.getPlayerStats(category)
        // TheSportsDB (grátis) não fornece rankings de jogadores → vazio.
        if (PROVIDER === 'thesportsdb') return []
        return await delay(playerStats[category])
      } catch (err) {
        throw toAppError(err)
      }
    })
  },
}

export { USE_MOCK, PROVIDER }
