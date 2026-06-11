import type { GroupStanding, StandingRow } from '@/types'
import { countries } from './countries'

/** Linha zerada (seleção que ainda não entrou em campo). */
function emptyRow(countryId: number, position: number): StandingRow {
  return {
    countryId,
    position,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0,
    form: [],
  }
}

/** Gera a classificação inicial (tudo zerado) para os 12 grupos. */
function buildInitialStandings(): GroupStanding[] {
  const byGroup = new Map<string, number[]>()
  for (const c of countries) {
    if (!byGroup.has(c.group)) byGroup.set(c.group, [])
    byGroup.get(c.group)!.push(c.id)
  }
  return [...byGroup.entries()].map(([group, ids]) => ({
    group,
    rows: ids.map((id, i) => emptyRow(id, i + 1)),
  }))
}

export const standings: GroupStanding[] = buildInitialStandings()

// ── Atualiza o Grupo A com o resultado da abertura: México 2 x 0 África do Sul.
const groupA = standings.find((g) => g.group === 'A')!
groupA.rows = [
  { countryId: 1, position: 1, played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, goalDifference: 2, points: 3, form: ['V'] }, // México
  { countryId: 3, position: 2, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, form: [] }, // Coreia do Sul
  { countryId: 4, position: 3, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0, form: [] }, // Rep. Tcheca
  { countryId: 2, position: 4, played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 2, goalDifference: -2, points: 0, form: ['D'] }, // África do Sul
]
