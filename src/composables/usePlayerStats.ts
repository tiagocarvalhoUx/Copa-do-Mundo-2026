import { storeToRefs } from 'pinia'
import { usePlayerStore } from '@/stores/playerStore'

/** Facade reativa sobre o playerStore. */
export function usePlayerStats() {
  const store = usePlayerStore()
  const refs = storeToRefs(store)
  return {
    ...refs,
    fetchRanking: store.fetchRanking,
    fetchAll: store.fetchAll,
    ranking: store.ranking,
  }
}
