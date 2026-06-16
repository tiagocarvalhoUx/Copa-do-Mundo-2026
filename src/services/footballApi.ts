/**
 * Fachada tipada de acesso a dados de futebol.
 *
 * Seleciona a FONTE de dados via `VITE_DATA_PROVIDER`:
 *   - 'mock'         → dados locais curados (padrão; funciona sem internet/chave)
 *   - 'thesportsdb'  → TheSportsDB (ao vivo, grátis; jogos + classificação calculada)
 *   - 'apifootball'  → API-Football (requer chave e plano que cubra a temporada)
 *   - 'footballdata' → football-data.org v4 (requer chave; jogos, classificação e artilheiros)
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
import { footballData, FootballDataError } from './footballData'
import { espn, EspnError } from './espn'

type Provider = 'mock' | 'thesportsdb' | 'apifootball' | 'footballdata' | 'espn'
const PROVIDER = (import.meta.env.VITE_DATA_PROVIDER ?? 'mock') as Provider
const USE_MOCK = PROVIDER === 'mock'

/** Rótulo amigável da fonte de dados (usado no rodapé). */
export const DATA_SOURCE_LABEL =
  PROVIDER === 'espn'
    ? 'Dados ao vivo via ESPN.'
    : PROVIDER === 'thesportsdb'
      ? 'Dados ao vivo via TheSportsDB.'
      : PROVIDER === 'apifootball'
        ? 'Dados ao vivo via API-Football.'
        : PROVIDER === 'footballdata'
          ? 'Dados ao vivo via football-data.org.'
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
  if (
    err instanceof ApiFootballError ||
    err instanceof TheSportsDbError ||
    err instanceof FootballDataError ||
    err instanceof EspnError
  ) {
    return new ApiError(err.message, err.code)
  }
  if (err instanceof ApiError) return err
  return new ApiError('Ocorreu um erro ao carregar os dados. Tente novamente.', 'unknown')
}

/** Simula latência no modo mock para exercitar os loading states. */
function delay<T>(value: T, ms = 350): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

// Jogos ao vivo: cache curtíssimo para refletir gols quase em tempo real.
const matchesTtl = USE_MOCK ? TTL.static : TTL.live
// Classificação e estatísticas mudam mais devagar (só quando um jogo encerra).
const slowTtl = USE_MOCK ? TTL.static : TTL.matches

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
    return cached('matches', matchesTtl, async () => {
      try {
        if (PROVIDER === 'espn') return await espn.getMatches()
        if (PROVIDER === 'thesportsdb') return await theSportsDb.getMatches()
        if (PROVIDER === 'apifootball') return await apiFootball.getMatches()
        if (PROVIDER === 'footballdata') return await footballData.getMatches()
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

  /**
   * Um jogo por id. A API-Football fornece os detalhes completos (eventos,
   * escalações e estatísticas) por jogo, então buscamos o jogo individual para
   * preencher as abas de detalhe. As demais fontes não têm esses dados por jogo,
   * então caímos na lista (cacheada) — só o placar/estado estará disponível.
   */
  async getMatch(id: number): Promise<Match> {
    if (USE_MOCK) {
      const found = matches.find((m) => m.id === id)
      if (!found) throw new ApiError('Jogo não encontrado.', 'not-found')
      return delay(found, 250)
    }
    if (PROVIDER === 'espn' || PROVIDER === 'apifootball') {
      return cached(`match:${id}`, matchesTtl, async () => {
        try {
          return PROVIDER === 'espn'
            ? await espn.getMatchDetails(id)
            : await apiFootball.getMatchDetails(id)
        } catch (err) {
          throw toAppError(err)
        }
      })
    }
    const found = (await this.getMatches()).find((m) => m.id === id)
    if (!found) throw new ApiError('Jogo não encontrado.', 'not-found')
    return found
  },

  /** Classificação dos grupos. */
  async getStandings(): Promise<GroupStanding[]> {
    return cached('standings', slowTtl, async () => {
      try {
        if (PROVIDER === 'espn') return await espn.getStandings()
        if (PROVIDER === 'thesportsdb') return await theSportsDb.getStandings()
        if (PROVIDER === 'apifootball') return await apiFootball.getStandings()
        if (PROVIDER === 'footballdata') return await footballData.getStandings()
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
    return cached(`stats:${category}`, slowTtl, async () => {
      try {
        if (USE_MOCK) return await delay(playerStats[category])

        let live: PlayerStat[] = []
        if (PROVIDER === 'apifootball') live = await apiFootball.getPlayerStats(category)
        else if (PROVIDER === 'footballdata') live = await footballData.getPlayerStats(category)
        // TheSportsDB (grátis) não fornece rankings de jogadores → vazio.

        // Cartões (amarelos/vermelhos) não vêm nas APIs grátis. Quando a fonte
        // ao vivo não traz a categoria, usamos a base curada de súmulas oficiais
        // para não deixar a tela vazia.
        const isCards = category === 'cartoes-amarelos' || category === 'cartoes-vermelhos'
        if (live.length === 0 && isCards) return playerStats[category]
        return live
      } catch (err) {
        throw toAppError(err)
      }
    })
  },
}

export { USE_MOCK, PROVIDER }
