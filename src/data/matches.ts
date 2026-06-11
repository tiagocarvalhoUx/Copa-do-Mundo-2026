import type { Match, MatchTeam } from '@/types'
import { countryById } from './countries'

/** Cria um MatchTeam a partir do id do país e o placar. */
function team(countryId: number, score: number | null): MatchTeam {
  const c = countryById.get(countryId)!
  return { countryId, name: c.name, code: c.code, flag: c.flag, score }
}

/**
 * Jogos das primeiras rodadas da Copa do Mundo 2026 (dados reais verificados).
 * Datas no fuso de Brasília (UTC−3).
 *
 * O jogo de abertura (id=1) — México 2 x 0 África do Sul, no Azteca — já está
 * ENCERRADO, com gols de Julián Quiñones e Raúl Jiménez.
 */
export const matches: Match[] = [
  // ───────────────────── ENCERRADO — Abertura ─────────────────────
  {
    id: 1,
    date: '2026-06-11T16:00:00-03:00',
    status: 'encerrado',
    stage: 'Fase de Grupos',
    group: 'A',
    home: team(1, 2), // México
    away: team(2, 0), // África do Sul
    stadiumId: 1, // Estádio Azteca
    events: [
      { id: 1, minute: 8, type: 'gol', teamId: 1, player: 'Julián Quiñones', relatedPlayer: 'Erik Lira' },
      { id: 2, minute: 21, type: 'gol', teamId: 1, player: 'Raúl Jiménez', relatedPlayer: 'Roberto Alvarado' },
    ],
    stats: {
      1: { possession: 61, shots: 14, shotsOnTarget: 6, corners: 7, fouls: 8, yellowCards: 1, redCards: 0, offsides: 2, passes: 560, passAccuracy: 89 },
      2: { possession: 39, shots: 5, shotsOnTarget: 1, corners: 2, fouls: 13, yellowCards: 2, redCards: 1, offsides: 1, passes: 330, passAccuracy: 81 },
    },
  },

  // ───────────────────── AGENDADOS — 11/06 ─────────────────────
  {
    id: 2,
    date: '2026-06-11T23:00:00-03:00',
    status: 'agendado',
    stage: 'Fase de Grupos',
    group: 'A',
    home: team(3, null), // Coreia do Sul
    away: team(4, null), // República Tcheca
    stadiumId: 2, // Estadio Akron
    events: [],
  },

  // ───────────────────── AGENDADOS — 12/06 ─────────────────────
  {
    id: 3,
    date: '2026-06-12T16:00:00-03:00',
    status: 'agendado',
    stage: 'Fase de Grupos',
    group: 'B',
    home: team(5, null), // Canadá
    away: team(6, null), // Bósnia e Herzegovina
    stadiumId: 3, // BMO Field
    events: [],
  },
  {
    id: 4,
    date: '2026-06-12T22:00:00-03:00',
    status: 'agendado',
    stage: 'Fase de Grupos',
    group: 'D',
    home: team(13, null), // Estados Unidos
    away: team(14, null), // Paraguai
    stadiumId: 7, // SoFi Stadium
    events: [],
  },

  // ───────────────────── AGENDADOS — 13/06 ─────────────────────
  {
    id: 5,
    date: '2026-06-13T16:00:00-03:00',
    status: 'agendado',
    stage: 'Fase de Grupos',
    group: 'B',
    home: team(7, null), // Catar
    away: team(8, null), // Suíça
    stadiumId: 4, // Levi's Stadium
    events: [],
  },
  {
    id: 6,
    date: '2026-06-13T19:00:00-03:00',
    status: 'agendado',
    stage: 'Fase de Grupos',
    group: 'C',
    home: team(9, null), // Brasil
    away: team(10, null), // Marrocos
    stadiumId: 5, // MetLife Stadium
    events: [],
  },
  {
    id: 7,
    date: '2026-06-13T22:00:00-03:00',
    status: 'agendado',
    stage: 'Fase de Grupos',
    group: 'C',
    home: team(11, null), // Haiti
    away: team(12, null), // Escócia
    stadiumId: 6, // Gillette Stadium
    events: [],
  },
]
