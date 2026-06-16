import { defineStore } from 'pinia'
import type { BracketRound, GroupStanding, Match } from '@/types'
import { footballApi, ApiError } from '@/services/footballApi'

/** Erro amigável extraído de qualquer exceção. */
function friendly(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return 'Algo deu errado ao carregar os dados. Tente novamente.'
}

interface State {
  matches: Match[]
  standings: GroupStanding[]
  bracket: BracketRound[]
  currentMatch: Match | null
  loading: boolean
  error: string | null
}

/** Store de jogos, resultados e classificação. */
export const useGameStore = defineStore('game', {
  state: (): State => ({
    matches: [],
    standings: [],
    bracket: [],
    currentMatch: null,
    loading: false,
    error: null,
  }),

  getters: {
    liveMatches: (s): Match[] =>
      s.matches.filter((m) => m.status === 'ao-vivo' || m.status === 'intervalo'),

    finishedMatches: (s): Match[] => s.matches.filter((m) => m.status === 'encerrado'),

    upcomingMatches: (s): Match[] =>
      s.matches
        .filter((m) => m.status === 'agendado')
        .sort((a, b) => +new Date(a.date) - +new Date(b.date)),

    /** Jogos cujo início é hoje (no fuso local). */
    todayMatches: (s): Match[] => {
      const today = new Date().toDateString()
      return s.matches.filter((m) => new Date(m.date).toDateString() === today)
    },

    /** Próximo jogo a começar — usado na contagem regressiva da Home. */
    nextMatch(): Match | undefined {
      return this.upcomingMatches[0]
    },

    standingByGroup: (s) => (group: string): GroupStanding | undefined =>
      s.standings.find((g) => g.group === group),
  },

  actions: {
    async fetchMatches() {
      this.loading = true
      this.error = null
      try {
        this.matches = await footballApi.getMatches()
      } catch (err) {
        this.error = friendly(err)
      } finally {
        this.loading = false
      }
    },

    async fetchStandings() {
      this.error = null
      try {
        this.standings = await footballApi.getStandings()
      } catch (err) {
        this.error = friendly(err)
      }
    },

    async fetchBracket() {
      this.error = null
      try {
        this.bracket = await footballApi.getBracket()
      } catch (err) {
        this.error = friendly(err)
      }
    },

    async fetchMatch(id: number) {
      this.loading = true
      this.error = null
      this.currentMatch = null
      try {
        this.currentMatch = await footballApi.getMatch(id)
      } catch (err) {
        this.error = friendly(err)
      } finally {
        this.loading = false
      }
    },

    /**
     * Atualização silenciosa para o polling ao vivo: não aciona `loading` nem
     * limpa o placar atual, então a tela não pisca a cada ciclo. Mantém o último
     * dado válido em caso de falha pontual de rede.
     */
    async refreshMatch(id: number) {
      try {
        this.currentMatch = await footballApi.getMatch(id)
      } catch {
        /* mantém o último placar; o próximo ciclo tenta de novo */
      }
    },

    /** Versão silenciosa de fetchMatches para o polling das listagens ao vivo. */
    async refreshMatches() {
      try {
        this.matches = await footballApi.getMatches()
      } catch {
        /* mantém os últimos jogos carregados */
      }
    },
  },
})
