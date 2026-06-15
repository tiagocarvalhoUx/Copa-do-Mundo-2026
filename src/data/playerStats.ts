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
 * Artilheiros acumulados após a 1ª rodada (11 jogos, 32 gols, até 14/06/2026).
 * Kai Havertz e Folarin Balogun lideram com 2 gols cada.
 *
 * Assistências e cartões não têm dados consolidados confiáveis nesta fase —
 * ficam vazios até a próxima rodada (o app exibe estado "sem dados").
 */
const goals: RawStat[] = [
  { playerId: 1, name: 'Kai Havertz', countryId: 17, position: 'ATA', value: 2, matchesPlayed: 1 },
  { playerId: 2, name: 'Folarin Balogun', countryId: 13, position: 'ATA', value: 2, matchesPlayed: 1 },
  { playerId: 3, name: 'Vinícius Júnior', countryId: 9, position: 'ATA', value: 1, matchesPlayed: 1 },
  { playerId: 4, name: 'Jamal Musiala', countryId: 17, position: 'MEI', value: 1, matchesPlayed: 1 },
  { playerId: 5, name: 'Deniz Undav', countryId: 17, position: 'ATA', value: 1, matchesPlayed: 1 },
  { playerId: 6, name: 'Breel Embolo', countryId: 8, position: 'ATA', value: 1, matchesPlayed: 1 },
  { playerId: 7, name: 'Gio Reyna', countryId: 13, position: 'MEI', value: 1, matchesPlayed: 1 },
  { playerId: 8, name: 'Virgil van Dijk', countryId: 21, position: 'ZAG', value: 1, matchesPlayed: 1 },
  { playerId: 9, name: 'John McGinn', countryId: 12, position: 'MEI', value: 1, matchesPlayed: 1 },
  { playerId: 10, name: 'Julián Quiñones', countryId: 1, position: 'ATA', value: 1, matchesPlayed: 1 },
  { playerId: 11, name: 'Raúl Jiménez', countryId: 1, position: 'ATA', value: 1, matchesPlayed: 1 },
  { playerId: 12, name: 'Hwang In-beom', countryId: 3, position: 'VOL', value: 1, matchesPlayed: 1 },
  { playerId: 13, name: 'Daichi Kamada', countryId: 22, position: 'MEI', value: 1, matchesPlayed: 1 },
  { playerId: 14, name: 'Nestory Irankunda', countryId: 15, position: 'ATA', value: 1, matchesPlayed: 1 },
  { playerId: 15, name: 'Keito Nakamura', countryId: 22, position: 'ATA', value: 1, matchesPlayed: 1 },
]

export const playerStats: Record<StatCategory, PlayerStat[]> = {
  gols: expand(goals),
  assistencias: [],
  'cartoes-amarelos': [],
  'cartoes-vermelhos': [],
}
