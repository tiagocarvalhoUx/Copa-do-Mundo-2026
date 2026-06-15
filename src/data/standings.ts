import type { GroupStanding, StandingRow } from '@/types'
import { countries, countryById } from './countries'
import { matches } from './matches'

/**
 * Classificação dos 12 grupos, DERIVADA dos jogos encerrados em `matches.ts`
 * (fonte única de verdade). Seleções que ainda não jogaram aparecem zeradas.
 * Ordenação: pontos → saldo de gols → gols pró.
 */
function buildStandings(): GroupStanding[] {
  const rows = new Map<number, StandingRow>()
  for (const c of countries) {
    rows.set(c.id, {
      countryId: c.id,
      position: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
      form: [],
    })
  }

  for (const m of matches) {
    if (m.status !== 'encerrado' || m.home.score === null || m.away.score === null) continue
    const h = rows.get(m.home.countryId)
    const a = rows.get(m.away.countryId)
    if (!h || !a) continue
    const hs = m.home.score
    const as = m.away.score
    h.played++; a.played++
    h.goalsFor += hs; h.goalsAgainst += as
    a.goalsFor += as; a.goalsAgainst += hs
    if (hs > as) {
      h.won++; h.points += 3; h.form.push('V'); a.lost++; a.form.push('D')
    } else if (hs < as) {
      a.won++; a.points += 3; a.form.push('V'); h.lost++; h.form.push('D')
    } else {
      h.drawn++; a.drawn++; h.points++; a.points++; h.form.push('E'); a.form.push('E')
    }
  }

  const byGroup = new Map<string, StandingRow[]>()
  for (const c of countries) {
    const row = rows.get(c.id)!
    row.goalDifference = row.goalsFor - row.goalsAgainst
    if (!byGroup.has(c.group)) byGroup.set(c.group, [])
    byGroup.get(c.group)!.push(row)
  }

  return [...byGroup.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, list]) => {
      list.sort(
        (x, y) =>
          y.points - x.points ||
          y.goalDifference - x.goalDifference ||
          y.goalsFor - x.goalsFor ||
          // desempate estável: ranking FIFA (melhor ranking primeiro)
          (countryById.get(x.countryId)!.fifaRanking - countryById.get(y.countryId)!.fifaRanking),
      )
      list.forEach((row, i) => (row.position = i + 1))
      return { group, rows: list }
    })
}

export const standings: GroupStanding[] = buildStandings()
