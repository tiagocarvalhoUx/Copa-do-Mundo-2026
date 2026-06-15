/**
 * Cliente da football-data.org (API v4) — dados AO VIVO da Copa do Mundo.
 *
 * O que a API fornece (plano grátis): jogos (data, status, placar, fase, grupo,
 * estádio), classificação dos grupos e artilheiros (gols + assistências).
 * O que NÃO fornece: rankings de cartões (amarelos/vermelhos) → devolvidos vazios.
 *
 * ⚠️ CORS: a football-data.org NÃO envia cabeçalhos CORS, então o navegador
 * bloqueia chamadas diretas. Em desenvolvimento usamos o proxy do Vite
 * (ver `vite.config.ts`); em produção, aponte `VITE_FOOTBALLDATA_URL` para um
 * proxy próprio (serverless/edge) que injete o cabeçalho `X-Auth-Token`.
 *
 * Os METADADOS curados (bandeira, nome em PT-BR, grupo) vêm da base local e são
 * casados pelo nome em inglês (ou código de 3 letras) devolvido pela API.
 *
 * Config (.env):
 *   VITE_FOOTBALLDATA_KEY          — sua chave (football-data.org)
 *   VITE_FOOTBALLDATA_URL          — base da API (padrão usa o proxy '/api/footballdata/v4')
 *   VITE_FOOTBALLDATA_COMPETITION  — código da competição (padrão 'WC' = FIFA World Cup)
 */
import type {
  GroupStanding,
  Match,
  MatchStatus,
  MatchTeam,
  PlayerStat,
  StandingRow,
  StatCategory,
} from '@/types'
import { countries } from '@/data/countries'
import { localByName, localStadiumId } from './theSportsDb'

const KEY = import.meta.env.VITE_FOOTBALLDATA_KEY ?? ''
const BASE = import.meta.env.VITE_FOOTBALLDATA_URL ?? '/api/footballdata/v4'
const COMPETITION = import.meta.env.VITE_FOOTBALLDATA_COMPETITION ?? 'WC'

export class FootballDataError extends Error {
  code?: string
  constructor(message: string, code?: string) {
    super(message)
    this.name = 'FootballDataError'
    this.code = code
  }
}

async function get<T>(path: string): Promise<T> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new FootballDataError('Você está sem conexão com a internet. Tentaremos reconectar.', 'offline')
  }
  let res: Response
  try {
    // A chave também pode ser injetada pelo proxy; enviá-la aqui cobre o uso direto.
    res = await fetch(`${BASE}${path}`, {
      headers: KEY ? { 'X-Auth-Token': KEY } : undefined,
    })
  } catch {
    throw new FootballDataError('Erro de comunicação com o servidor. Tente novamente.', 'network')
  }
  if (!res.ok) {
    if (res.status === 429) {
      throw new FootballDataError('Muitas requisições à API. Aguarde um instante e tente de novo.', '429')
    }
    if (res.status === 403 || res.status === 401) {
      throw new FootballDataError('Acesso negado pela API. Verifique sua chave de acesso.', String(res.status))
    }
    throw new FootballDataError('Não foi possível carregar os dados agora. Tente novamente.', String(res.status))
  }
  return (await res.json()) as T
}

// ── Casamento com a base local de metadados ─────────────────────────────────

const codeToId = new Map(countries.map((c) => [c.code.toUpperCase(), c.id]))

/** Encontra a seleção local pelo nome (inglês) ou, como fallback, pelo código (tla). */
function matchCountry(name: string, tla?: string | null) {
  const byName = localByName(name)
  if (byName) return byName
  const id = tla ? codeToId.get(tla.toUpperCase()) : undefined
  return id ? countries.find((c) => c.id === id) : undefined
}

// ── Tipagem mínima das respostas da API ─────────────────────────────────────

interface FdTeam {
  id: number
  name: string | null
  shortName: string | null
  tla: string | null
  crest: string | null
}

interface FdScore {
  fullTime: { home: number | null; away: number | null }
}

interface FdMatch {
  id: number
  utcDate: string
  status: string
  minute?: number | null
  stage: string
  group: string | null
  homeTeam: FdTeam
  awayTeam: FdTeam
  score: FdScore
  venue?: string | null
}

interface FdTableRow {
  position: number
  team: FdTeam
  playedGames: number
  form: string | null
  won: number
  draw: number
  lost: number
  points: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
}

interface FdStanding {
  stage: string
  type: string
  group: string | null
  table: FdTableRow[]
}

interface FdScorer {
  player: { id: number; name: string; position: string | null }
  team: FdTeam
  playedMatches: number | null
  goals: number | null
  assists: number | null
}

// ── Conversores ─────────────────────────────────────────────────────────────

function mapStatus(status: string): MatchStatus {
  switch (status) {
    case 'IN_PLAY':
      return 'ao-vivo'
    case 'PAUSED':
      return 'intervalo'
    case 'FINISHED':
    case 'AWARDED':
      return 'encerrado'
    case 'POSTPONED':
    case 'SUSPENDED':
    case 'CANCELLED':
      return 'adiado'
    default:
      return 'agendado'
  }
}

function mapStage(stage: string): Match['stage'] {
  switch (stage) {
    case 'LAST_32':
      return '16-avos de Final'
    case 'LAST_16':
      return 'Oitavas de Final'
    case 'QUARTER_FINALS':
      return 'Quartas de Final'
    case 'SEMI_FINALS':
      return 'Semifinal'
    case 'THIRD_PLACE':
      return 'Disputa de 3º Lugar'
    case 'FINAL':
      return 'Final'
    default:
      return 'Fase de Grupos'
  }
}

/** "GROUP_A" → "A". */
function mapGroup(group: string | null): string | undefined {
  if (!group) return undefined
  const m = group.match(/group[_\s]*([a-l])/i)
  return m ? m[1].toUpperCase() : undefined
}

function teamFrom(t: FdTeam, score: number | null): MatchTeam {
  const c = matchCountry(t.name ?? '', t.tla)
  return {
    countryId: c?.id ?? 0,
    name: c?.name ?? t.name ?? '—',
    code: c?.code ?? t.tla ?? '',
    flag: c?.flag ?? '🏳️',
    score,
  }
}

function mapMatch(m: FdMatch): Match {
  const status = mapStatus(m.status)
  const home = teamFrom(m.homeTeam, m.score.fullTime.home)
  const away = teamFrom(m.awayTeam, m.score.fullTime.away)
  return {
    id: m.id,
    date: m.utcDate,
    status,
    minute: status === 'ao-vivo' && m.minute != null ? m.minute : undefined,
    stage: mapStage(m.stage),
    group: mapGroup(m.group),
    home,
    away,
    stadiumId: localStadiumId(m.venue),
    venue: m.venue ?? undefined,
    events: [],
  }
}

/** "W,D,L" → ['V','E','D'] (últimos 5). */
function mapForm(form: string | null): Array<'V' | 'E' | 'D'> {
  return (form ?? '')
    .split(',')
    .map((ch) => ch.trim().toUpperCase())
    .filter(Boolean)
    .map((ch) => (ch === 'W' ? 'V' : ch === 'D' ? 'E' : 'D'))
    .slice(-5) as Array<'V' | 'E' | 'D'>
}

function mapStandings(standings: FdStanding[]): GroupStanding[] {
  return standings
    .filter((s) => s.type === 'TOTAL' && s.group)
    .map((s) => {
      const rows: StandingRow[] = s.table.map((r) => ({
        countryId: matchCountry(r.team.name ?? '', r.team.tla)?.id ?? 0,
        position: r.position,
        played: r.playedGames,
        won: r.won,
        drawn: r.draw,
        lost: r.lost,
        goalsFor: r.goalsFor,
        goalsAgainst: r.goalsAgainst,
        goalDifference: r.goalDifference,
        points: r.points,
        form: mapForm(r.form),
      }))
      return { group: mapGroup(s.group) ?? '?', rows }
    })
    .sort((a, b) => a.group.localeCompare(b.group))
}

function mapScorers(scorers: FdScorer[], category: StatCategory): PlayerStat[] {
  return scorers.map((p) => {
    const local = matchCountry(p.team.name ?? '', p.team.tla)
    const value = category === 'assistencias' ? p.assists ?? 0 : p.goals ?? 0
    return {
      playerId: p.player.id,
      name: p.player.name,
      countryId: local?.id ?? 0,
      countryName: local?.name ?? p.team.name ?? '—',
      countryFlag: local?.flag ?? '🏳️',
      position: p.player.position ?? '—',
      value,
      matchesPlayed: p.playedMatches ?? 0,
    }
  })
}

// ── API pública ──────────────────────────────────────────────────────────────

export const footballData = {
  async getMatches(): Promise<Match[]> {
    const data = await get<{ matches: FdMatch[] }>(`/competitions/${COMPETITION}/matches`)
    return (data.matches ?? [])
      .map(mapMatch)
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))
  },

  async getStandings(): Promise<GroupStanding[]> {
    const data = await get<{ standings: FdStanding[] }>(`/competitions/${COMPETITION}/standings`)
    return mapStandings(data.standings ?? [])
  },

  async getPlayerStats(category: StatCategory): Promise<PlayerStat[]> {
    // A football-data.org só expõe artilharia (gols) e assistências no /scorers.
    if (category === 'cartoes-amarelos' || category === 'cartoes-vermelhos') return []
    const data = await get<{ scorers: FdScorer[] }>(`/competitions/${COMPETITION}/scorers?limit=20`)
    return mapScorers(data.scorers ?? [], category)
  },
}
