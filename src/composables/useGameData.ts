import { storeToRefs } from 'pinia'
import { useGameStore } from '@/stores/gameStore'

/**
 * Facade reativa sobre o gameStore — atalho ergonômico para os componentes.
 * Mantém a regra do projeto: componentes nunca chamam a API diretamente.
 */
export function useGameData() {
  const store = useGameStore()
  const refs = storeToRefs(store)
  return {
    ...refs,
    fetchMatches: store.fetchMatches,
    fetchStandings: store.fetchStandings,
    fetchMatch: store.fetchMatch,
  }
}
