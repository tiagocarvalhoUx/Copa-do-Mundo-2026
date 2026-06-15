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
 * Estatísticas individuais após a 1ª rodada (11 jogos, até 14/06/2026).
 * Dados reais verificados (súmulas oficiais / Wikipédia).
 *   • Artilheiros: Havertz e Balogun lideram com 2 gols.
 *   • Cartões vermelhos: 3 só em México 2×0 África do Sul (recorde de Copas).
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

const assists: RawStat[] = [
  { playerId: 20, name: 'Erik Lira', countryId: 1, position: 'VOL', value: 1, matchesPlayed: 1 },
  { playerId: 21, name: 'Roberto Alvarado', countryId: 1, position: 'MEI', value: 1, matchesPlayed: 1 },
  { playerId: 22, name: 'Lee Kang-in', countryId: 3, position: 'MEI', value: 1, matchesPlayed: 1 },
  { playerId: 23, name: 'Hwang In-beom', countryId: 3, position: 'VOL', value: 1, matchesPlayed: 1 },
  { playerId: 24, name: 'Vladimír Coufal', countryId: 4, position: 'LAT', value: 1, matchesPlayed: 1 },
  { playerId: 25, name: 'Brahim Díaz', countryId: 10, position: 'MEI', value: 1, matchesPlayed: 1 },
  { playerId: 26, name: 'Ché Adams', countryId: 12, position: 'ATA', value: 1, matchesPlayed: 1 },
]

const yellowCards: RawStat[] = [
  { playerId: 30, name: 'Memphis Depay', countryId: 21, position: 'ATA', value: 1, matchesPlayed: 1 },
  { playerId: 31, name: 'Casemiro', countryId: 9, position: 'VOL', value: 1, matchesPlayed: 1 },
  { playerId: 32, name: 'Roger Ibañez', countryId: 9, position: 'ZAG', value: 1, matchesPlayed: 1 },
  { playerId: 33, name: 'Denis Zakaria', countryId: 8, position: 'VOL', value: 1, matchesPlayed: 1 },
  { playerId: 34, name: 'Tyler Adams', countryId: 13, position: 'VOL', value: 1, matchesPlayed: 1 },
  { playerId: 35, name: 'Miguel Almirón', countryId: 14, position: 'MEI', value: 1, matchesPlayed: 1 },
  { playerId: 36, name: 'Alistair Johnston', countryId: 5, position: 'LAT', value: 1, matchesPlayed: 1 },
  { playerId: 37, name: 'Franck Kessié', countryId: 19, position: 'VOL', value: 1, matchesPlayed: 1 },
  { playerId: 38, name: 'Micky van de Ven', countryId: 21, position: 'ZAG', value: 1, matchesPlayed: 1 },
  { playerId: 39, name: 'Yunus Akgün', countryId: 16, position: 'MEI', value: 1, matchesPlayed: 1 },
  { playerId: 40, name: 'Teboho Mokoena', countryId: 2, position: 'VOL', value: 1, matchesPlayed: 1 },
  { playerId: 41, name: 'Brian Gutiérrez', countryId: 1, position: 'MEI', value: 1, matchesPlayed: 1 },
  { playerId: 42, name: 'Diego Gómez', countryId: 14, position: 'MEI', value: 1, matchesPlayed: 1 },
  { playerId: 43, name: 'Seko Fofana', countryId: 19, position: 'VOL', value: 1, matchesPlayed: 1 },
  { playerId: 44, name: 'Ermedin Demirović', countryId: 6, position: 'ATA', value: 1, matchesPlayed: 1 },
]

const redCards: RawStat[] = [
  { playerId: 50, name: 'Sphephelo Sithole', countryId: 2, position: 'MEI', value: 1, matchesPlayed: 1 },
  { playerId: 51, name: 'Themba Zwane', countryId: 2, position: 'MEI', value: 1, matchesPlayed: 1 },
  { playerId: 52, name: 'César Montes', countryId: 1, position: 'ZAG', value: 1, matchesPlayed: 1 },
]

export const playerStats: Record<StatCategory, PlayerStat[]> = {
  gols: expand(goals),
  assistencias: expand(assists),
  'cartoes-amarelos': expand(yellowCards),
  'cartoes-vermelhos': expand(redCards),
}
