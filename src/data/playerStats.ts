import type { PlayerStat, StatCategory } from '@/types'
import { countryById } from './countries'

interface RawStat {
  playerId: number
  name: string
  countryId: number
  position: string
  value: number
  matchesPlayed: number
}

function expand(raw: RawStat[]): PlayerStat[] {
  return raw.map((r) => {
    const c = countryById.get(r.countryId)!
    return { ...r, countryName: c.name, countryFlag: c.flag }
  })
}

/**
 * Estatísticas acumuladas (dados reais após a abertura).
 * No 1º dia de torneio, apenas o jogo México 2 x 0 África do Sul foi disputado,
 * então os rankings refletem somente os gols e assistências dessa partida.
 */
const goals: RawStat[] = [
  { playerId: 101, name: 'Julián Quiñones', countryId: 1, position: 'ATA', value: 1, matchesPlayed: 1 },
  { playerId: 102, name: 'Raúl Jiménez', countryId: 1, position: 'ATA', value: 1, matchesPlayed: 1 },
]

const assists: RawStat[] = [
  { playerId: 103, name: 'Erik Lira', countryId: 1, position: 'VOL', value: 1, matchesPlayed: 1 },
  { playerId: 104, name: 'Roberto Alvarado', countryId: 1, position: 'MEI', value: 1, matchesPlayed: 1 },
]

export const playerStats: Record<StatCategory, PlayerStat[]> = {
  gols: expand(goals),
  assistencias: expand(assists),
  'cartoes-amarelos': [],
  'cartoes-vermelhos': [],
}
