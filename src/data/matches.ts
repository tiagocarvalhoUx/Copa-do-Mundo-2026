import type { Match, MatchTeam } from '@/types'
import { countryById } from './countries'

/** Cria um MatchTeam a partir do id do país e o placar. */
function team(countryId: number, score: number | null): MatchTeam {
  const c = countryById.get(countryId)!
  return { countryId, name: c.name, code: c.code, flag: c.flag, score }
}

/**
 * Jogos da 1ª rodada da Copa do Mundo 2026 (dados reais verificados, 11–14/06).
 * Datas no fuso de Brasília (UTC−3). Todos os 11 jogos abaixo já foram disputados.
 *
 * Fontes: páginas oficiais dos grupos (Wikipédia) e cobertura ao vivo —
 * 32 gols em 11 partidas até 14/06/2026.
 */
export const matches: Match[] = [
  // ───────────────────── 11/06 · Grupo A ─────────────────────
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
      { id: 1, minute: 9, type: 'gol', teamId: 1, player: 'Julián Quiñones', relatedPlayer: 'Erik Lira' },
      { id: 2, minute: 17, type: 'cartao-amarelo', teamId: 2, player: 'Teboho Mokoena' },
      { id: 3, minute: 23, type: 'cartao-amarelo', teamId: 1, player: 'Brian Gutiérrez' },
      { id: 4, minute: 49, type: 'cartao-vermelho', teamId: 2, player: 'Sphephelo Sithole' },
      { id: 5, minute: 67, type: 'gol', teamId: 1, player: 'Raúl Jiménez', relatedPlayer: 'Roberto Alvarado' },
      { id: 6, minute: 74, type: 'cartao-amarelo', teamId: 2, player: 'Nkosinathi Sibisi' },
      { id: 7, minute: 84, type: 'cartao-vermelho', teamId: 2, player: 'Themba Zwane' },
      { id: 8, minute: 90, extra: 2, type: 'cartao-vermelho', teamId: 1, player: 'César Montes' },
    ],
    stats: {
      1: { possession: 61, shots: 14, shotsOnTarget: 6, corners: 7, fouls: 8, yellowCards: 1, redCards: 1, offsides: 2, passes: 560, passAccuracy: 89 },
      2: { possession: 39, shots: 5, shotsOnTarget: 1, corners: 2, fouls: 13, yellowCards: 2, redCards: 2, offsides: 1, passes: 330, passAccuracy: 81 },
    },
  },
  {
    id: 2,
    date: '2026-06-11T22:00:00-03:00',
    status: 'encerrado',
    stage: 'Fase de Grupos',
    group: 'A',
    home: team(3, 2), // Coreia do Sul
    away: team(4, 1), // República Tcheca
    stadiumId: 2, // Estadio Akron
    events: [
      { id: 1, minute: 59, type: 'gol', teamId: 4, player: 'Ladislav Krejčí', relatedPlayer: 'Vladimír Coufal' },
      { id: 2, minute: 67, type: 'gol', teamId: 3, player: 'Hwang In-beom', relatedPlayer: 'Lee Kang-in' },
      { id: 3, minute: 80, type: 'gol', teamId: 3, player: 'Oh Hyeon-gyu', relatedPlayer: 'Hwang In-beom' },
    ],
  },

  // ───────────────────── 12/06 · Grupos B e D ─────────────────────
  {
    id: 3,
    date: '2026-06-12T16:00:00-03:00',
    status: 'encerrado',
    stage: 'Fase de Grupos',
    group: 'B',
    home: team(5, 1), // Canadá
    away: team(6, 1), // Bósnia e Herzegovina
    stadiumId: 3, // BMO Field
    events: [
      { id: 1, minute: 21, type: 'gol', teamId: 6, player: 'Jovo Lukić' },
      { id: 2, minute: 78, type: 'gol', teamId: 5, player: 'Cyle Larin' },
    ],
  },
  {
    id: 4,
    date: '2026-06-12T22:00:00-03:00',
    status: 'encerrado',
    stage: 'Fase de Grupos',
    group: 'D',
    home: team(13, 4), // Estados Unidos
    away: team(14, 1), // Paraguai
    stadiumId: 7, // SoFi Stadium
    events: [
      { id: 1, minute: 7, type: 'gol-contra', teamId: 13, player: 'Gol contra (Damián Bobadilla)' },
      { id: 2, minute: 31, type: 'gol', teamId: 13, player: 'Folarin Balogun' },
      { id: 3, minute: 45, extra: 5, type: 'gol', teamId: 13, player: 'Folarin Balogun' },
      { id: 4, minute: 73, type: 'gol', teamId: 14, player: 'Maurício' },
      { id: 5, minute: 90, extra: 8, type: 'gol', teamId: 13, player: 'Gio Reyna' },
    ],
  },

  // ───────────────────── 13/06 · Grupos B, C e D ─────────────────────
  {
    id: 5,
    date: '2026-06-13T16:00:00-03:00',
    status: 'encerrado',
    stage: 'Fase de Grupos',
    group: 'B',
    home: team(7, 1), // Catar
    away: team(8, 1), // Suíça
    stadiumId: 4, // Levi's Stadium
    events: [
      { id: 1, minute: 17, type: 'penalti', teamId: 8, player: 'Breel Embolo' },
      { id: 2, minute: 90, extra: 4, type: 'gol-contra', teamId: 7, player: 'Gol contra (Miro Muheim)' },
    ],
  },
  {
    id: 6,
    date: '2026-06-13T19:00:00-03:00',
    status: 'encerrado',
    stage: 'Fase de Grupos',
    group: 'C',
    home: team(9, 1), // Brasil
    away: team(10, 1), // Marrocos
    stadiumId: 5, // MetLife Stadium
    events: [
      { id: 1, minute: 21, type: 'gol', teamId: 10, player: 'Ismael Saibari', relatedPlayer: 'Brahim Díaz' },
      { id: 2, minute: 32, type: 'gol', teamId: 9, player: 'Vinícius Júnior' },
    ],
  },
  {
    id: 7,
    date: '2026-06-13T22:00:00-03:00',
    status: 'encerrado',
    stage: 'Fase de Grupos',
    group: 'C',
    home: team(11, 0), // Haiti
    away: team(12, 1), // Escócia
    stadiumId: 6, // Gillette Stadium
    events: [
      { id: 1, minute: 28, type: 'gol', teamId: 12, player: 'John McGinn', relatedPlayer: 'Ché Adams' },
    ],
  },
  {
    id: 8,
    date: '2026-06-13T20:00:00-03:00',
    status: 'encerrado',
    stage: 'Fase de Grupos',
    group: 'D',
    home: team(15, 2), // Austrália
    away: team(16, 0), // Turquia
    stadiumId: 9, // BC Place
    events: [
      { id: 1, minute: 27, type: 'gol', teamId: 15, player: 'Nestory Irankunda' },
      { id: 2, minute: 75, type: 'gol', teamId: 15, player: 'Metcalfe' },
    ],
  },

  // ───────────────────── 14/06 · Grupos E e F ─────────────────────
  {
    id: 9,
    date: '2026-06-14T14:00:00-03:00',
    status: 'encerrado',
    stage: 'Fase de Grupos',
    group: 'E',
    home: team(17, 7), // Alemanha
    away: team(18, 1), // Curaçao
    stadiumId: 10, // NRG Stadium
    events: [
      { id: 1, minute: 6, type: 'gol', teamId: 17, player: 'Felix Nmecha' },
      { id: 2, minute: 21, type: 'gol', teamId: 18, player: 'Livano Comenencia' },
      { id: 3, minute: 38, type: 'gol', teamId: 17, player: 'Nico Schlotterbeck' },
      { id: 4, minute: 45, extra: 5, type: 'penalti', teamId: 17, player: 'Kai Havertz' },
      { id: 5, minute: 47, type: 'gol', teamId: 17, player: 'Jamal Musiala' },
      { id: 6, minute: 68, type: 'gol', teamId: 17, player: 'Brown' },
      { id: 7, minute: 78, type: 'gol', teamId: 17, player: 'Deniz Undav' },
      { id: 8, minute: 88, type: 'gol', teamId: 17, player: 'Kai Havertz' },
    ],
  },
  {
    id: 10,
    date: '2026-06-14T20:00:00-03:00',
    status: 'encerrado',
    stage: 'Fase de Grupos',
    group: 'E',
    home: team(19, 1), // Costa do Marfim
    away: team(20, 0), // Equador
    stadiumId: 11, // Lincoln Financial Field
    events: [
      { id: 1, minute: 90, type: 'gol', teamId: 19, player: 'Amad Diallo' },
    ],
  },
  {
    id: 11,
    date: '2026-06-14T17:00:00-03:00',
    status: 'encerrado',
    stage: 'Fase de Grupos',
    group: 'F',
    home: team(21, 2), // Países Baixos
    away: team(22, 2), // Japão
    stadiumId: 8, // AT&T Stadium
    events: [
      { id: 1, minute: 50, type: 'gol', teamId: 21, player: 'Virgil van Dijk' },
      { id: 2, minute: 57, type: 'gol', teamId: 22, player: 'Keito Nakamura' },
      { id: 3, minute: 64, type: 'gol', teamId: 21, player: 'Crysencio Summerville' },
      { id: 4, minute: 88, type: 'gol', teamId: 22, player: 'Daichi Kamada' },
    ],
  },

  // ───────────────────── 15/06 · Grupos H e G (agendados) ─────────────────────
  {
    id: 12,
    date: '2026-06-15T13:00:00-03:00',
    status: 'agendado',
    stage: 'Fase de Grupos',
    group: 'H',
    home: team(29, null), // Espanha
    away: team(30, null), // Cabo Verde
    stadiumId: 13, // Mercedes-Benz Stadium
    events: [],
  },
  {
    id: 13,
    date: '2026-06-15T16:00:00-03:00',
    status: 'agendado',
    stage: 'Fase de Grupos',
    group: 'G',
    home: team(25, null), // Bélgica
    away: team(26, null), // Egito
    stadiumId: 12, // Lumen Field
    events: [],
  },
  {
    id: 14,
    date: '2026-06-15T19:00:00-03:00',
    status: 'agendado',
    stage: 'Fase de Grupos',
    group: 'H',
    home: team(31, null), // Arábia Saudita
    away: team(32, null), // Uruguai
    stadiumId: 14, // Hard Rock Stadium
    events: [],
  },
  {
    id: 15,
    date: '2026-06-15T22:00:00-03:00',
    status: 'agendado',
    stage: 'Fase de Grupos',
    group: 'G',
    home: team(27, null), // Irã
    away: team(28, null), // Nova Zelândia
    stadiumId: 7, // SoFi Stadium
    events: [],
  },

  // ───────────────────── 16/06 · Grupo I (agendados) ─────────────────────
  {
    id: 16,
    date: '2026-06-16T16:00:00-03:00',
    status: 'agendado',
    stage: 'Fase de Grupos',
    group: 'I',
    home: team(33, null), // França
    away: team(34, null), // Senegal
    stadiumId: 5, // MetLife Stadium
    events: [],
  },
  {
    id: 17,
    date: '2026-06-16T19:00:00-03:00',
    status: 'agendado',
    stage: 'Fase de Grupos',
    group: 'I',
    home: team(35, null), // Iraque
    away: team(36, null), // Noruega
    stadiumId: 6, // Gillette Stadium
    events: [],
  },
]
