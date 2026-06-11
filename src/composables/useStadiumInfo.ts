import { storeToRefs } from 'pinia'
import { useStadiumStore } from '@/stores/stadiumStore'

/** Facade reativa sobre o stadiumStore (estádios + países). */
export function useStadiumInfo() {
  const store = useStadiumStore()
  const refs = storeToRefs(store)
  return {
    ...refs,
    fetchStadiums: store.fetchStadiums,
    fetchCountries: store.fetchCountries,
    ensureCountries: store.ensureCountries,
    stadiumById: store.stadiumById,
    countryById: store.countryById,
  }
}
