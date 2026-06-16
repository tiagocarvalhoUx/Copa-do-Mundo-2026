/**
 * Cliente da API-Football (api-sports.io) v3 — mapeamento das respostas cruas
 * para os tipos de domínio do app.
 *
 * Endpoints usados:
 *   GET /standings?league={id}&season={year}
 *   GET /fixtures?league={id}&season={year}
 *   GET /fixtures?live=all&league={id}
 *   GET /players/topscorers?league={id}&season={year}
 *   GET /players/topassists?league={id}&season={year}
 *   GET /players/topredcards | topyellowcards ...
 *
 * Configuração via .env:
 *   VITE_FOOTBALL_API_KEY   — sua chave (api-sports.io)
 *   VITE_FOOTBALL_API_URL   — ex.: https://v3.football.api-sports.io
 *   VITE_FOOTBALL_LEAGUE_ID — id da Copa do Mundo na API (ex.: 1)
 *   VITE_FOOTBALL_SEASON    — temporada (ex.: 2026)
 *
 * Os METADADOS de seleções e estádios vêm da base local curada
 * (`@/data`) — emoji de bandeira, nome em PT-BR, técnico, grupo —, casados
 * por nome/código com o que a API devolve.
 */
import type {
  GroupStanding,
  Lineup,
  LineupPlayer,
  Match,
  MatchEvent,
  MatchEventType,
  MatchStatus,
  PlayerStat,
  StandingRow,
  StatCategory,
  TeamMatchStats,
} from '@/types'
import { countries } from '@/data/countries'
import { stadiums } from '@/data/stadiums'

const API_KEY = import.meta.env.VITE_FOOTBALL_API_KEY ?? ''
const API_URL = import.meta.env.VITE_FOOTBALL_API_URL ?? 'https://v3.football.api-sports.io'
const LEAGUE = import.meta.env.VITE_FOOTBALL_LEAGUE_ID ?? '1'
const SEASON = import.meta.env.VITE_FOOTBALL_SEASON ?? '2026'

// A mesma API é servida por dois caminhos com headers de autenticação diferentes:
//   • Direto (api-sports.io)  → header 'x-apisports-key'
//   • Via RapidAPI            → headers 'X-RapidAPI-Key' + 'X-RapidAPI-Host'
// Detectamos pelo host da URL para que ambos funcionem sem mudar o código.
const IS_RAPIDAPI = /rapidapi\.com/i.test(API_URL)
function authHeaders(): Record<string, string> {
  if (IS_RAPIDAPI) {
    return {
      'X-RapidAPI-Key': API_KEY,
      'X-RapidAPI-Host': new URL(API_URL).host,
    }
  }
  return { 'x-apisports-key': API_KEY }
}

export class ApiFootballError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'ApiFootballError'
    this.code = code
  }
}

/** Envelope padrão da API-Football. */
interface ApiResponse<T> {
  response: T
  errors?: unknown
}

async function get<T>(path: string): Promise<T> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new ApiFootballError('Você está sem conexão com a internet. Tentaremos reconectar.', 'offline')
  }
  let res: Response
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { ...authHeaders(), Accept: 'application/json' },
    })
  } catch {
    throw new ApiFootballError('Erro de comunicação com o servidor. Tente novamente.', 'network')
  }
  if (!res.ok) {
    throw new ApiFootballError('Não foi possível carregar os dados agora. Tente novamente.', String(res.status))
  }
  const json = (await res.json()) as ApiResponse<T>
  return json.response
}

// ── Casamento com a base local de metadados ─────────────────────────────────

const norm = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/** Encontra o país local por nome/código (devolve o id e os metadados). */
function localCountry(name: string, code?: string) {
  const n = norm(name)
  return (
    countries.find((c) => c.code.toLowerCase() === (code ?? '').toLowerCase()) ??
    countries.find((c) => norm(c.name) === n) ??
    countries.find((c) => norm(c.name).includes(n) || n.includes(norm(c.name)))
  )
}

function localStadiumId(venueName?: string): number {
  if (!venueName) return 0
  const n = norm(venueName)
  return stadiums.find((s) => norm(s.name).includes(n) || n.includes(norm(s.name)))?.id ?? 0
}

// ── Tipagem mínima das respostas da API ─────────────────────────────────────

interface ApiTeam {
  id: number
  name: string
  logo: string
}

interface ApiStandingRow {
  rank: number
  team: ApiTeam
  points: number
  goalsDiff: number
  group: string
  form: string | null
  all: {
    played: number
    win: number
    draw: number
    lose: number
    goals: { for: number; against: number }
  }
}

interface ApiStandingsLeague {
  league: { standings: ApiStandingRow[][] }
}

interface ApiFixture {
  fixture: {
    id: number
    date: string
    status: { short: string; elapsed: number | null }
    venue: { id: number | null; name: string | null; city: string | null }
  }
  league: { round: string }
  teams: { home: ApiTeam; away: ApiTeam }
  goals: { home: number | null; away: number | null }
}

interface ApiTopPlayer {
  player: { id: number; name: string }
  statistics: Array<{
    team: ApiTeam
    games: { position: string | null; appearences: number | null }
    goals: { total: number | null; assists: number | null }
    cards: { yellow: number | null; red: number | null }
  }>
}

// ── Detalhes de um jogo (eventos, escalações, estatísticas) ─────────────────
// A resposta de GET /fixtures?id={id} traz estes blocos embutidos no fixture.

interface ApiEvent {
  time: { elapsed: number | null; extra: number | null }
  team: { id: number; name: string }
  player: { id: number | null; name: string | null }
  assist: { id: number | null; name: string | null }
  type: string // "Goal" | "Card" | "subst" | "Var"
  detail: string // "Normal Goal" | "Own Goal" | "Penalty" | "Yellow Card" | "Red Card" | "Substitution N" ...
}

interface ApiLineupPlayer {
  player: { id: number; name: string; number: number | null; pos: string | null; grid: string | null }
}

interface ApiLineup {
  team: { id: number; name: string }
  formation: string | null
  startXI: ApiLineupPlayer[]
  substitutes: ApiLineupPlayer[]
  coach: { id: number | null; name: string | null }
}

interface ApiTeamStats {
  team: { id: number }
  statistics: Array<{ type: string; value: number | string | null }>
}

/** Fixture individual: o mesmo do /fixtures + blocos de detalhe. */
interface ApiFixtureFull extends ApiFixture {
  events?: ApiEvent[]
  lineups?: ApiLineup[]
  statistics?: ApiTeamStats[]
}

// ── Conversores ─────────────────────────────────────────────────────────────

function mapStatus(short: string): MatchStatus {
  if (['1H', '2H', 'ET', 'P', 'LIVE'].includes(short)) return 'ao-vivo'
  if (short === 'HT') return 'intervalo'
  if (['FT', 'AET', 'PEN'].includes(short)) return 'encerrado'
  if (['PST', 'CANC', 'SUSP', 'ABD'].includes(short)) return 'adiado'
  return 'agendado'
}

function mapRoundToStage(round: string): Match['stage'] {
  const r = round.toLowerCase()
  if (r.includes('final') && !r.includes('semi') && !r.includes('quarter')) return 'Final'
  if (r.includes('semi')) return 'Semifinal'
  if (r.includes('quarter')) return 'Quartas de Final'
  if (r.includes('round of 16') || r.includes('8th')) return 'Oitavas de Final'
  if (r.includes('round of 32')) return '16-avos de Final'
  return 'Fase de Grupos'
}

function mapFixture(f: ApiFixture): Match {
  const home = localCountry(f.teams.home.name)
  const away = localCountry(f.teams.away.name)
  return {
    id: f.fixture.id,
    date: f.fixture.date,
    status: mapStatus(f.fixture.status.short),
    minute: f.fixture.status.elapsed ?? undefined,
    stage: mapRoundToStage(f.league.round),
    home: {
      countryId: home?.id ?? f.teams.home.id,
      name: home?.name ?? f.teams.home.name,
      code: home?.code ?? '',
      flag: home?.flag ?? '🏳️',
      score: f.goals.home,
    },
    away: {
      countryId: away?.id ?? f.teams.away.id,
      name: away?.name ?? f.teams.away.name,
      code: away?.code ?? '',
      flag: away?.flag ?? '🏳️',
      score: f.goals.away,
    },
    stadiumId: localStadiumId(f.fixture.venue.name ?? undefined),
    events: [],
  }
}

/** Traduz o par (type, detail) da API para o tipo de evento do app. Retorna
 *  null para eventos que não exibimos (VAR, pênalti perdido, etc.). */
function mapEventType(type: string, detail: string): MatchEventType | null {
  const t = type.toLowerCase()
  const d = detail.toLowerCase()
  if (t === 'goal') {
    if (d.includes('missed')) return null // pênalti perdido não altera o placar
    if (d.includes('own')) return 'gol-contra'
    if (d.includes('penalty')) return 'penalti'
    return 'gol'
  }
  if (t === 'card') {
    if (d.includes('yellow')) return 'cartao-amarelo'
    if (d.includes('red')) return 'cartao-vermelho'
    return null
  }
  if (t === 'subst') return 'substituicao'
  return null
}

function mapEvents(events: ApiEvent[], teamToCountry: Map<number, number>): MatchEvent[] {
  const out: MatchEvent[] = []
  events.forEach((e, i) => {
    const type = mapEventType(e.type, e.detail)
    if (!type) return
    out.push({
      id: i + 1,
      minute: e.time.elapsed ?? 0,
      extra: e.time.extra ?? undefined,
      type,
      teamId: teamToCountry.get(e.team.id) ?? 0,
      player: e.player.name ?? '—',
      relatedPlayer: e.assist.name ?? undefined,
    })
  })
  return out.sort((a, b) => a.minute - b.minute || (a.extra ?? 0) - (b.extra ?? 0))
}

/** Posições da API (G/D/M/F) → rótulos curtos em PT-BR usados na UI. */
const POSITION_PT: Record<string, string> = { G: 'GOL', D: 'ZAG', M: 'MEI', F: 'ATA' }
function mapPosition(pos: string | null): string {
  return pos ? POSITION_PT[pos.toUpperCase()] ?? pos : '—'
}

function mapLineups(lineups: ApiLineup[], teamToCountry: Map<number, number>): Record<number, Lineup> {
  const out: Record<number, Lineup> = {}
  for (const l of lineups) {
    const cid = teamToCountry.get(l.team.id) ?? 0
    const toPlayer = (p: ApiLineupPlayer, starter: boolean): LineupPlayer => ({
      number: p.player.number ?? 0,
      name: p.player.name,
      position: mapPosition(p.player.pos),
      starter,
    })
    out[cid] = {
      formation: l.formation ?? '—',
      coach: l.coach?.name ?? '—',
      players: [
        ...l.startXI.map((p) => toPlayer(p, true)),
        ...l.substitutes.map((p) => toPlayer(p, false)),
      ],
    }
  }
  return out
}

/** "55%" | 12 | null → número (0 quando ausente). */
function statNumber(v: number | string | null): number {
  if (v == null) return 0
  if (typeof v === 'number') return v
  const n = parseInt(v.replace('%', ''), 10)
  return Number.isNaN(n) ? 0 : n
}

function mapStats(stats: ApiTeamStats[], teamToCountry: Map<number, number>): Record<number, TeamMatchStats> {
  const out: Record<number, TeamMatchStats> = {}
  for (const s of stats) {
    const cid = teamToCountry.get(s.team.id) ?? 0
    const val = (type: string) => statNumber(s.statistics.find((x) => x.type === type)?.value ?? null)
    out[cid] = {
      possession: val('Ball Possession'),
      shots: val('Total Shots'),
      shotsOnTarget: val('Shots on Goal'),
      corners: val('Corner Kicks'),
      fouls: val('Fouls'),
      yellowCards: val('Yellow Cards'),
      redCards: val('Red Cards'),
      offsides: val('Offsides'),
      passes: val('Total passes'),
      passAccuracy: val('Passes %'),
    }
  }
  return out
}

function mapStandings(leagues: ApiStandingsLeague[]): GroupStanding[] {
  const allGroups = leagues[0]?.league.standings ?? []
  return allGroups.map((rows) => {
    const group = (rows[0]?.group ?? '').replace(/group\s*/i, '').trim() || '?'
    const mapped: StandingRow[] = rows.map((r) => ({
      countryId: localCountry(r.team.name)?.id ?? r.team.id,
      position: r.rank,
      played: r.all.played,
      won: r.all.win,
      drawn: r.all.draw,
      lost: r.all.lose,
      goalsFor: r.all.goals.for,
      goalsAgainst: r.all.goals.against,
      goalDifference: r.goalsDiff,
      points: r.points,
      form: (r.form ?? '')
        .split('')
        .map((ch) => (ch === 'W' ? 'V' : ch === 'D' ? 'E' : 'D'))
        .filter((_, i, arr) => i >= arr.length - 5) as Array<'V' | 'E' | 'D'>,
    }))
    return { group, rows: mapped }
  })
}

const CATEGORY_ENDPOINT: Record<StatCategory, string> = {
  gols: 'topscorers',
  assistencias: 'topassists',
  'cartoes-amarelos': 'topyellowcards',
  'cartoes-vermelhos': 'topredcards',
}

function mapTopPlayers(players: ApiTopPlayer[], category: StatCategory): PlayerStat[] {
  return players.map((p) => {
    const st = p.statistics[0]
    const local = localCountry(st.team.name)
    let value = 0
    if (category === 'gols') value = st.goals.total ?? 0
    else if (category === 'assistencias') value = st.goals.assists ?? 0
    else if (category === 'cartoes-amarelos') value = st.cards.yellow ?? 0
    else value = st.cards.red ?? 0
    return {
      playerId: p.player.id,
      name: p.player.name,
      countryId: local?.id ?? st.team.id,
      countryName: local?.name ?? st.team.name,
      countryFlag: local?.flag ?? '🏳️',
      position: st.games.position ?? '—',
      value,
      matchesPlayed: st.games.appearences ?? 0,
    }
  })
}

// ── API pública ──────────────────────────────────────────────────────────────

export const apiFootball = {
  async getMatches(): Promise<Match[]> {
    const fixtures = await get<ApiFixture[]>(`/fixtures?league=${LEAGUE}&season=${SEASON}`)
    return fixtures.map(mapFixture).sort((a, b) => +new Date(a.date) - +new Date(b.date))
  },

  /**
   * Detalhes de UM jogo: eventos (gols/cartões/substituições), escalações e
   * estatísticas. A API embute tudo na resposta de /fixtures?id={id}, então é
   * uma única chamada. Preenche as abas Eventos/Escalações/Estatísticas.
   */
  async getMatchDetails(id: number): Promise<Match> {
    const arr = await get<ApiFixtureFull[]>(`/fixtures?id=${id}`)
    const f = arr[0]
    if (!f) throw new ApiFootballError('Jogo não encontrado.', 'not-found')

    const base = mapFixture(f)
    // Os blocos de detalhe referenciam o time pelo id da API; convertemos para o
    // countryId local já resolvido no fixture base (por nome).
    const teamToCountry = new Map<number, number>([
      [f.teams.home.id, base.home.countryId],
      [f.teams.away.id, base.away.countryId],
    ])

    base.events = f.events?.length ? mapEvents(f.events, teamToCountry) : []
    if (f.lineups?.length) base.lineups = mapLineups(f.lineups, teamToCountry)
    if (f.statistics?.length) base.stats = mapStats(f.statistics, teamToCountry)
    return base
  },

  async getStandings(): Promise<GroupStanding[]> {
    const leagues = await get<ApiStandingsLeague[]>(`/standings?league=${LEAGUE}&season=${SEASON}`)
    return mapStandings(leagues)
  },

  async getPlayerStats(category: StatCategory): Promise<PlayerStat[]> {
    const players = await get<ApiTopPlayer[]>(
      `/players/${CATEGORY_ENDPOINT[category]}?league=${LEAGUE}&season=${SEASON}`,
    )
    return mapTopPlayers(players, category)
  },
}
