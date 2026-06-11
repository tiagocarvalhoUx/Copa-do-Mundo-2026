import { defineStore } from 'pinia'
import type { PlayerStat, StatCategory } from '@/types'
import { footballApi, ApiError } from '@/services/footballApi'

function friendly(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return 'Não foi possível carregar as estatísticas. Tente novamente.'
}

interface State {
  /** Cache de rankings por categoria. */
  rankings: Partial<Record<StatCategory, PlayerStat[]>>
  loading: boolean
  error: string | null
}

/** Store de estatísticas de jogadores (artilheiros, assistências, cartões). */
export const usePlayerStore = defineStore('player', {
  state: (): State => ({
    rankings: {},
    loading: false,
    error: null,
  }),

  getters: {
    ranking: (s) => (category: StatCategory): PlayerStat[] => s.rankings[category] ?? [],
    topScorer: (s): PlayerStat | undefined => s.rankings.gols?.[0],
  },

  actions: {
    async fetchRanking(category: StatCategory) {
      this.loading = true
      this.error = null
      try {
        this.rankings[category] = await footballApi.getPlayerStats(category)
      } catch (err) {
        this.error = friendly(err)
      } finally {
        this.loading = false
      }
    },

    /** Carrega todas as categorias de uma vez. */
    async fetchAll() {
      this.loading = true
      this.error = null
      try {
        const categories: StatCategory[] = ['gols', 'assistencias', 'cartoes-amarelos', 'cartoes-vermelhos']
        const results = await Promise.all(categories.map((c) => footballApi.getPlayerStats(c)))
        categories.forEach((c, i) => {
          this.rankings[c] = results[i]
        })
      } catch (err) {
        this.error = friendly(err)
      } finally {
        this.loading = false
      }
    },
  },
})
