/**
 * Cliente da TheSportsDB (https://www.thesportsdb.com) — dados AO VIVO da
 * Copa do Mundo 2026 (league id 4429), grátis e acessível direto do navegador.
 *
 * O que a API fornece: jogos (data, status, placar, estádio, rodada).
 * O que NÃO fornece (plano grátis): autores de gols, escalações e rankings de
 * jogadores. A classificação dos grupos é CALCULADA a partir dos jogos
 * encerrados (mais confiável que a tabela do plano grátis, que vem incompleta).
 *
 * Os METADADOS curados (bandeira, nome em PT-BR, grupo) vêm da base local e são
 * casados pelo nome em inglês que a API devolve.
 *
 * Config (.env):
 *   VITE_TSDB_KEY     — chave (padrão "3")
 *   VITE_TSDB_LEAGUE  — id da liga (padrão 4429 = FIFA World Cup)
 *   VITE_TSDB_SEASON  — temporada (padrão 2026)
 */
import type {
  Country,
  GroupStanding,
  Match,
  MatchStatus,
  MatchTeam,
  StandingRow,
} from '@/types'
import { countries, countryById } from '@/data/countries'
import { stadiums } from '@/data/stadiums'

const KEY = import.meta.env.VITE_TSDB_KEY ?? '3'
const LEAGUE = import.meta.env.VITE_TSDB_LEAGUE ?? '4429'
const SEASON = import.meta.env.VITE_TSDB_SEASON ?? '2026'
const BASE = `https://www.thesportsdb.com/api/v1/json/${KEY}`

export class TheSportsDbError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'TheSportsDbError'
    this.code = code
  }
}

async function get<T>(path: string): Promise<T> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new TheSportsDbError('Você está sem conexão com a internet. Tentaremos reconectar.', 'offline')
  }
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`)
  } catch {
    throw new TheSportsDbError('Erro de comunicação com o servidor. Tente novamente.', 'network')
  }
  if (!res.ok) {
    throw new TheSportsDbError('Não foi possível carregar os dados agora. Tente novamente.', String(res.status))
  }
  return (await res.json()) as T
}

// ── Casamento de nome (inglês) → seleção local ──────────────────────────────

export const normName = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')

/** Mapa nome-em-inglês (normalizado) → id local. Cobre as 48 seleções + apelidos. */
const NAME_TO_ID: Record<string, number> = {
  mexico: 1,
  southafrica: 2,
  southkorea: 3,
  korearepublic: 3,
  czechrepublic: 4,
  czechia: 4,
  canada: 5,
  bosniaherzegovina: 6,
  bosniaandherzegovina: 6,
  qatar: 7,
  switzerland: 8,
  brazil: 9,
  morocco: 10,
  haiti: 11,
  scotland: 12,
  usa: 13,
  unitedstates: 13,
  paraguay: 14,
  australia: 15,
  turkey: 16,
  turkiye: 16,
  germany: 17,
  curacao: 18,
  ivorycoast: 19,
  cotedivoire: 19,
  ecuador: 20,
  netherlands: 21,
  japan: 22,
  sweden: 23,
  tunisia: 24,
  belgium: 25,
  egypt: 26,
  iran: 27,
  newzealand: 28,
  spain: 29,
  capeverde: 30,
  saudiarabia: 31,
  uruguay: 32,
  france: 33,
  senegal: 34,
  iraq: 35,
  norway: 36,
  argentina: 37,
  algeria: 38,
  austria: 39,
  jordan: 40,
  portugal: 41,
  drcongo: 42,
  democraticrepublicofcongo: 42,
  congodr: 42,
  uzbekistan: 43,
  colombia: 44,
  england: 45,
  croatia: 46,
  ghana: 47,
  panama: 48,
}

/** Casa um nome em inglês (devolvido pelas APIs) com a seleção local curada. */
export function localByName(name: string): Country | undefined {
  const id = NAME_TO_ID[normName(name)]
  return id ? countryById.get(id) : undefined
}

export function localStadiumId(venue?: string | null): number {
  if (!venue) return 0
  const n = normName(venue)
  return stadiums.find((s) => normName(s.name).includes(n) || n.includes(normName(s.name)))?.id ?? 0
}

// ── Resposta crua da API ────────────────────────────────────────────────────

interface TsdbEvent {
  idEvent: string
  strEvent: string
  strTimestamp: string | null
  dateEvent: string | null
  strTime: string | null
  strStatus: string | null
  strProgress: string | null
  intHomeScore: string | null
  intAwayScore: string | null
  strHomeTeam: string
  strAwayTeam: string
  intRound: string | null
  strVenue: string | null
}

function mapStatus(status: string | null): MatchStatus {
  const s = (status ?? '').toUpperCase().trim()
  if (['FT', 'AET', 'PEN', 'MATCH FINISHED'].includes(s)) return 'encerrado'
  if (s === 'HT') return 'intervalo'
  if (['1H', '2H', 'ET', 'P', 'LIVE'].includes(s)) return 'ao-vivo'
  if (s.includes('POSTPON') || s === 'PST' || s.includes('CANC')) return 'adiado'
  return 'agendado'
}

/** ISO em UTC (a API entrega strTimestamp sem fuso, em UTC). */
function isoDate(e: TsdbEvent): string {
  if (e.strTimestamp) {
    return e.strTimestamp.includes('Z') || e.strTimestamp.includes('+')
      ? e.strTimestamp
      : `${e.strTimestamp}Z`
  }
  if (e.dateEvent) return `${e.dateEvent}T${e.strTime ?? '00:00:00'}Z`
  return new Date().toISOString()
}

function teamFrom(name: string, score: string | null): MatchTeam {
  const c = localByName(name)
  const s = score === null || score === '' ? null : Number(score)
  return {
    countryId: c?.id ?? 0,
    name: c?.name ?? name,
    code: c?.code ?? '',
    flag: c?.flag ?? '🏳️',
    score: Number.isNaN(s as number) ? null : s,
  }
}

function mapStage(intRound: string | null): Match['stage'] {
  const r = Number(intRound)
  // Rodadas 1–3 = fase de grupos. (Mata-mata: a API usa números altos/strRound,
  // tratados como fase final genérica quando surgirem.)
  if (r >= 1 && r <= 3) return 'Fase de Grupos'
  if (r === 0 || Number.isNaN(r)) return 'Fase de Grupos'
  return 'Fase de Grupos'
}

function mapEvent(e: TsdbEvent): Match {
  const home = teamFrom(e.strHomeTeam, e.intHomeScore)
  const away = teamFrom(e.strAwayTeam, e.intAwayScore)
  const status = mapStatus(e.strStatus)
  // grupo: derivado da seleção mandante (ambas estão no mesmo grupo na 1ª fase)
  const group = countryById.get(home.countryId)?.group
  const minuteRaw = Number(e.strProgress)
  return {
    id: Number(e.idEvent),
    date: isoDate(e),
    status,
    minute: status === 'ao-vivo' && !Number.isNaN(minuteRaw) ? minuteRaw : undefined,
    stage: mapStage(e.intRound),
    group,
    home,
    away,
    stadiumId: localStadiumId(e.strVenue),
    venue: e.strVenue ?? undefined,
    events: [],
  }
}

// ── Cálculo da classificação a partir dos jogos ─────────────────────────────

function computeStandings(matches: Match[]): GroupStanding[] {
  const rows = new Map<number, StandingRow>()
  const formData = new Map<number, Array<{ d: number; r: 'V' | 'E' | 'D' }>>()

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
    formData.set(c.id, [])
  }

  const addForm = (id: number, r: 'V' | 'E' | 'D', d: number) => formData.get(id)?.push({ d, r })

  for (const m of matches) {
    if (m.status !== 'encerrado' || m.home.score === null || m.away.score === null) continue
    const h = rows.get(m.home.countryId)
    const a = rows.get(m.away.countryId)
    if (!h || !a) continue
    const hs = m.home.score
    const as = m.away.score
    const d = +new Date(m.date)
    h.played++; a.played++
    h.goalsFor += hs; h.goalsAgainst += as
    a.goalsFor += as; a.goalsAgainst += hs
    if (hs > as) {
      h.won++; h.points += 3; addForm(h.countryId, 'V', d); a.lost++; addForm(a.countryId, 'D', d)
    } else if (hs < as) {
      a.won++; a.points += 3; addForm(a.countryId, 'V', d); h.lost++; addForm(h.countryId, 'D', d)
    } else {
      h.drawn++; a.drawn++; h.points++; a.points++; addForm(h.countryId, 'E', d); addForm(a.countryId, 'E', d)
    }
  }

  const byGroup = new Map<string, StandingRow[]>()
  for (const c of countries) {
    const row = rows.get(c.id)!
    row.goalDifference = row.goalsFor - row.goalsAgainst
    row.form = (formData.get(c.id) ?? []).sort((x, y) => x.d - y.d).slice(-5).map((f) => f.r)
    if (!byGroup.has(c.group)) byGroup.set(c.group, [])
    byGroup.get(c.group)!.push(row)
  }

  return [...byGroup.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([group, list]) => {
      list.sort(
        (x, y) =>
          y.points - x.points || y.goalDifference - x.goalDifference || y.goalsFor - x.goalsFor,
      )
      list.forEach((row, i) => (row.position = i + 1))
      return { group, rows: list }
    })
}

// ── API pública ──────────────────────────────────────────────────────────────

export const theSportsDb = {
  async getMatches(): Promise<Match[]> {
    const data = await get<{ events: TsdbEvent[] | null }>(
      `/eventsseason.php?id=${LEAGUE}&s=${SEASON}`,
    )
    const events = data.events ?? []
    return events.map(mapEvent).sort((a, b) => +new Date(a.date) - +new Date(b.date))
  },

  async getStandings(): Promise<GroupStanding[]> {
    const matches = await this.getMatches()
    return computeStandings(matches)
  },
}
