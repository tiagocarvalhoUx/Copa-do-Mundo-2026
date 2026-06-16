/**
 * Cliente da API pública da ESPN — dados AO VIVO da Copa do Mundo 2026.
 *
 * Por que ESPN: é gratuita, NÃO exige chave e envia CORS liberado
 * (Access-Control-Allow-Origin: *), então o navegador chama direto. Diferente
 * das outras fontes grátis (TheSportsDB / football-data.org free), a ESPN
 * fornece DETALHES por jogo: eventos (gols, cartões, substituições),
 * escalações (com formação) e estatísticas — exatamente o que preenche as abas
 * Eventos / Escalações / Estatísticas da tela de detalhe.
 *
 * Endpoints:
 *   GET /scoreboard?dates=AAAAMMDD-AAAAMMDD  → lista de jogos (placar/estado)
 *   GET /summary?event={id}                  → detalhes de um jogo
 *
 * Os METADADOS curados (bandeira, nome em PT-BR, grupo) vêm da base local e são
 * casados pelo nome em inglês que a ESPN devolve (reusa o casamento do TheSportsDB).
 *
 * Config (.env, todas opcionais):
 *   VITE_ESPN_RANGE  — intervalo de datas da competição (padrão da Copa 2026)
 */
import type {
  GroupStanding,
  Lineup,
  LineupPlayer,
  Match,
  MatchEvent,
  MatchEventType,
  MatchStatus,
  MatchTeam,
  TeamMatchStats,
} from '@/types'
import { countryById } from '@/data/countries'
import { computeStandings, localByName, localStadiumId } from './theSportsDb'

const BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world'
const RANGE = import.meta.env.VITE_ESPN_RANGE ?? '20260611-20260719'

export class EspnError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'EspnError'
    this.code = code
  }
}

async function get<T>(path: string): Promise<T> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new EspnError('Você está sem conexão com a internet. Tentaremos reconectar.', 'offline')
  }
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`)
  } catch {
    throw new EspnError('Erro de comunicação com o servidor. Tente novamente.', 'network')
  }
  if (!res.ok) {
    throw new EspnError('Não foi possível carregar os dados agora. Tente novamente.', String(res.status))
  }
  return (await res.json()) as T
}

// ── Tipagem mínima das respostas ────────────────────────────────────────────

interface EspnTeam {
  id: string
  displayName: string
}
interface EspnCompetitor {
  homeAway: 'home' | 'away'
  team: EspnTeam
  score?: string
}
interface EspnStatusType {
  state: 'pre' | 'in' | 'post'
  name: string
}
interface EspnStatus {
  type: EspnStatusType
  displayClock?: string
}
interface EspnCompetition {
  date?: string
  competitors: EspnCompetitor[]
  venue?: { fullName?: string }
  status?: EspnStatus
}
interface EspnEvent {
  id: string
  date: string
  status: EspnStatus
  competitions: EspnCompetition[]
}
interface EspnScoreboard {
  events?: EspnEvent[]
}

interface EspnKeyEvent {
  type?: { text?: string }
  clock?: { displayValue?: string }
  team?: { id?: string }
  participants?: Array<{ athlete?: { displayName?: string } }>
}
interface EspnRosterEntry {
  starter?: boolean
  jersey?: string
  athlete?: { displayName?: string }
  position?: { abbreviation?: string }
}
interface EspnRoster {
  team?: { id?: string }
  formation?: string
  roster?: EspnRosterEntry[]
}
interface EspnBoxTeam {
  team?: { id?: string }
  statistics?: Array<{ name?: string; displayValue?: string }>
}
interface EspnSummary {
  header?: { competitions?: Array<{ date?: string; competitors?: EspnCompetitor[]; status?: EspnStatus }> }
  gameInfo?: { venue?: { fullName?: string } }
  keyEvents?: EspnKeyEvent[]
  rosters?: EspnRoster[]
  boxscore?: { teams?: EspnBoxTeam[] }
}

// ── Conversores comuns ──────────────────────────────────────────────────────

function mapStatus(t: EspnStatusType): MatchStatus {
  if (t.state === 'pre') return 'agendado'
  if (t.state === 'post') {
    const n = t.name.toUpperCase()
    if (n.includes('POSTPON') || n.includes('CANCEL') || n.includes('ABANDON')) return 'adiado'
    return 'encerrado'
  }
  // state 'in'
  return t.name.toUpperCase().includes('HALFTIME') ? 'intervalo' : 'ao-vivo'
}

/** "16'" → {16}; "90'+3'" → {minute:90, extra:3}. */
function parseClock(disp?: string): { minute: number; extra?: number } {
  if (!disp) return { minute: 0 }
  const m = disp.match(/(\d+)(?:'?\s*\+\s*(\d+))?/)
  if (!m) return { minute: 0 }
  return { minute: Number(m[1]), extra: m[2] ? Number(m[2]) : undefined }
}

function teamFrom(c: EspnCompetitor | undefined, isScheduled: boolean): MatchTeam {
  const local = c ? localByName(c.team.displayName) : undefined
  const raw = c?.score
  const parsed = raw === undefined || raw === '' ? null : Number(raw)
  const score = isScheduled || Number.isNaN(parsed as number) ? null : parsed
  return {
    countryId: local?.id ?? 0,
    name: local?.name ?? c?.team.displayName ?? '—',
    code: local?.code ?? '',
    flag: local?.flag ?? '🏳️',
    score,
  }
}

/** Monta o jogo "base" (sem detalhes) a partir de competidores + status. */
function buildMatch(opts: {
  id: number
  date: string
  status: EspnStatus
  competitors: EspnCompetitor[]
  venue?: string
}): Match {
  const status = mapStatus(opts.status.type)
  const scheduled = status === 'agendado'
  const home = teamFrom(opts.competitors.find((c) => c.homeAway === 'home'), scheduled)
  const away = teamFrom(opts.competitors.find((c) => c.homeAway === 'away'), scheduled)
  const { minute } = parseClock(opts.status.displayClock)
  return {
    id: opts.id,
    date: opts.date,
    status,
    minute: status === 'ao-vivo' && minute ? minute : undefined,
    stage: 'Fase de Grupos',
    group: countryById.get(home.countryId)?.group,
    home,
    away,
    stadiumId: localStadiumId(opts.venue),
    venue: opts.venue,
    events: [],
  }
}

function mapScoreboardEvent(e: EspnEvent): Match {
  const comp = e.competitions[0]
  return buildMatch({
    id: Number(e.id),
    date: e.date,
    status: e.status,
    competitors: comp.competitors,
    venue: comp.venue?.fullName,
  })
}

// ── Detalhes do jogo ────────────────────────────────────────────────────────

/** Mapa id-do-time-ESPN → countryId local (casado por nome). */
function teamToCountry(competitors: EspnCompetitor[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const c of competitors) map.set(c.team.id, localByName(c.team.displayName)?.id ?? 0)
  return map
}

function mapEventType(text: string): MatchEventType | null {
  const t = text.toLowerCase()
  if (t.includes('own goal')) return 'gol-contra'
  if (t.includes('penalty')) {
    if (t.includes('miss') || t.includes('saved')) return null // pênalti perdido não altera o placar
    return 'penalti'
  }
  if (t.includes('goal')) return 'gol'
  if (t.includes('yellow')) return 'cartao-amarelo'
  if (t.includes('red')) return 'cartao-vermelho'
  if (t.includes('substitution')) return 'substituicao'
  return null
}

function mapEvents(events: EspnKeyEvent[], tmap: Map<string, number>): MatchEvent[] {
  const out: MatchEvent[] = []
  events.forEach((e, i) => {
    const type = mapEventType(e.type?.text ?? '')
    if (!type) return
    const { minute, extra } = parseClock(e.clock?.displayValue)
    const players = (e.participants ?? [])
      .map((p) => p.athlete?.displayName)
      .filter((n): n is string => !!n)
    out.push({
      id: i + 1,
      minute,
      extra,
      type,
      teamId: tmap.get(e.team?.id ?? '') ?? 0,
      player: players[0] ?? '—',
      relatedPlayer: players[1],
    })
  })
  return out.sort((a, b) => a.minute - b.minute || (a.extra ?? 0) - (b.extra ?? 0))
}

const POSITION_PT: Record<string, string> = { G: 'GOL', D: 'ZAG', M: 'MEI', F: 'ATA' }
function mapPosition(abbr?: string): string {
  return abbr ? POSITION_PT[abbr.toUpperCase()] ?? abbr : '—'
}

function mapLineups(rosters: EspnRoster[], tmap: Map<string, number>): Record<number, Lineup> | undefined {
  const out: Record<number, Lineup> = {}
  let any = false
  for (const r of rosters) {
    const players: LineupPlayer[] = (r.roster ?? []).map((p) => ({
      number: p.jersey ? Number(p.jersey) : 0,
      name: p.athlete?.displayName ?? '—',
      position: mapPosition(p.position?.abbreviation),
      starter: !!p.starter,
    }))
    if (!players.length) continue
    out[tmap.get(r.team?.id ?? '') ?? 0] = { formation: r.formation ?? '—', coach: '—', players }
    any = true
  }
  return any ? out : undefined
}

function statValue(stats: EspnBoxTeam['statistics'], name: string): number {
  const v = stats?.find((s) => s.name === name)?.displayValue
  if (v == null) return 0
  const n = parseFloat(v.replace('%', ''))
  return Number.isNaN(n) ? 0 : n
}

function mapStats(teams: EspnBoxTeam[], tmap: Map<string, number>): Record<number, TeamMatchStats> | undefined {
  const out: Record<number, TeamMatchStats> = {}
  let any = false
  for (const t of teams) {
    const s = t.statistics ?? []
    if (!s.length) continue
    const accurate = statValue(s, 'accuratePasses')
    const passes = statValue(s, 'totalPasses')
    out[tmap.get(t.team?.id ?? '') ?? 0] = {
      possession: Math.round(statValue(s, 'possessionPct')),
      shots: statValue(s, 'totalShots'),
      shotsOnTarget: statValue(s, 'shotsOnTarget'),
      corners: statValue(s, 'wonCorners'),
      fouls: statValue(s, 'foulsCommitted'),
      yellowCards: statValue(s, 'yellowCards'),
      redCards: statValue(s, 'redCards'),
      offsides: statValue(s, 'offsides'),
      passes,
      passAccuracy: passes ? Math.round((accurate / passes) * 100) : 0,
    }
    any = true
  }
  return any ? out : undefined
}

// ── API pública ──────────────────────────────────────────────────────────────

export const espn = {
  async getMatches(): Promise<Match[]> {
    const data = await get<EspnScoreboard>(`/scoreboard?dates=${RANGE}&limit=300`)
    return (data.events ?? [])
      .map(mapScoreboardEvent)
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))
  },

  /** Detalhes de um jogo (eventos, escalações e estatísticas) numa única chamada. */
  async getMatchDetails(id: number): Promise<Match> {
    const summary = await get<EspnSummary>(`/summary?event=${id}`)
    const comp = summary.header?.competitions?.[0]
    const competitors = comp?.competitors ?? []
    if (!comp?.status || !competitors.length) {
      throw new EspnError('Jogo não encontrado.', 'not-found')
    }

    const base = buildMatch({
      id,
      date: comp.date ?? new Date().toISOString(),
      status: comp.status,
      competitors,
      venue: summary.gameInfo?.venue?.fullName,
    })

    const tmap = teamToCountry(competitors)
    base.events = summary.keyEvents?.length ? mapEvents(summary.keyEvents, tmap) : []
    const lineups = summary.rosters?.length ? mapLineups(summary.rosters, tmap) : undefined
    if (lineups) base.lineups = lineups
    const stats = summary.boxscore?.teams?.length ? mapStats(summary.boxscore.teams, tmap) : undefined
    if (stats) base.stats = stats
    return base
  },

  /** Classificação calculada a partir dos jogos encerrados (igual ao TheSportsDB). */
  async getStandings(): Promise<GroupStanding[]> {
    return computeStandings(await this.getMatches())
  },
}
