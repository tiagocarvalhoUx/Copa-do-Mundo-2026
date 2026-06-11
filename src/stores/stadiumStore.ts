import { defineStore } from 'pinia'
import type { Country, Stadium } from '@/types'
import { footballApi, ApiError } from '@/services/footballApi'

function friendly(err: unknown): string {
  if (err instanceof ApiError) return err.message
  return 'Não foi possível carregar os dados. Tente novamente.'
}

interface State {
  stadiums: Stadium[]
  countries: Country[]
  loading: boolean
  error: string | null
}

/**
 * Store de estádios e seleções/países (dados pouco voláteis, cacheados).
 */
export const useStadiumStore = defineStore('stadium', {
  state: (): State => ({
    stadiums: [],
    countries: [],
    loading: false,
    error: null,
  }),

  getters: {
    stadiumById: (s) => (id: number): Stadium | undefined =>
      s.stadiums.find((st) => st.id === id),

    countryById: (s) => (id: number): Country | undefined =>
      s.countries.find((c) => c.id === id),

    /** Países agrupados por grupo da Copa. */
    countriesByGroup: (s): Record<string, Country[]> => {
      return s.countries.reduce<Record<string, Country[]>>((acc, c) => {
        ;(acc[c.group] ??= []).push(c)
        return acc
      }, {})
    },
  },

  actions: {
    async fetchStadiums() {
      this.loading = true
      this.error = null
      try {
        this.stadiums = await footballApi.getStadiums()
      } catch (err) {
        this.error = friendly(err)
      } finally {
        this.loading = false
      }
    },

    async fetchCountries() {
      this.loading = true
      this.error = null
      try {
        this.countries = await footballApi.getCountries()
      } catch (err) {
        this.error = friendly(err)
      } finally {
        this.loading = false
      }
    },

    /** Garante que países estejam carregados (usado por vários componentes). */
    async ensureCountries() {
      if (this.countries.length === 0) await this.fetchCountries()
    },
  },
})
