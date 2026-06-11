/**
 * Tipos de domínio do App Copa do Mundo 2026.
 *
 * Estes tipos representam o modelo normalizado usado em TODO o frontend.
 * A camada de serviço (`services/footballApi.ts`) é responsável por mapear
 * a resposta crua da API (API-Football / Sportmonks) para estes tipos.
 */

/** País / Seleção participante. */
export interface Country {
  id: number
  /** Nome em português. Ex.: "Brasil" */
  name: string
  /** Código FIFA de 3 letras. Ex.: "BRA" */
  code: string
  /** Emoji da bandeira (fallback). Ex.: "🇧🇷" */
  flag: string
  /** Código da bandeira para imagens (flagcdn / ISO 3166-1 alpha-2 ou subdivisão).
   *  Ex.: "br", "gb-sct". Usado pelo componente CountryFlag. */
  flagCode: string
  /** Confederação continental. */
  confederation: Confederation
  /** Grupo na fase de grupos. Ex.: "A" */
  group: string
  /** Número de títulos mundiais conquistados. */
  titles: number
  /** Posição no ranking FIFA. */
  fifaRanking: number
  /** Apelido da seleção. Ex.: "Seleção Canarinho" */
  nickname?: string
  /** Treinador atual. */
  coach?: string
}

export type Confederation =
  | 'UEFA'
  | 'CONMEBOL'
  | 'CONCACAF'
  | 'CAF'
  | 'AFC'
  | 'OFC'

/** Estádio-sede. */
export interface Stadium {
  id: number
  name: string
  city: string
  /** País-sede (EUA, Canadá ou México). */
  country: string
  capacity: number
  /** URL da imagem do estádio. */
  image: string
  /** Ano de inauguração. */
  opened?: number
  /** IDs dos jogos que o estádio sediará. */
  matchIds: number[]
}

/** Status possível de um jogo. */
export type MatchStatus =
  | 'agendado' // ainda não começou
  | 'ao-vivo' // em andamento
  | 'intervalo' // intervalo do jogo
  | 'encerrado' // finalizado
  | 'adiado'

/** Fase da competição (formato 2026: 48 seleções → 32 avançam ao mata-mata). */
export type Stage =
  | 'Fase de Grupos'
  | '16-avos de Final'
  | 'Oitavas de Final'
  | 'Quartas de Final'
  | 'Semifinal'
  | 'Disputa de 3º Lugar'
  | 'Final'

/** Tipo de evento dentro de um jogo. */
export type MatchEventType =
  | 'gol'
  | 'gol-contra'
  | 'penalti'
  | 'cartao-amarelo'
  | 'cartao-vermelho'
  | 'substituicao'

/** Um evento na linha do tempo do jogo. */
export interface MatchEvent {
  id: number
  /** Minuto do jogo. Ex.: 45 */
  minute: number
  /** Acréscimos, se houver. Ex.: 2 (para 45+2) */
  extra?: number
  type: MatchEventType
  /** ID do país/seleção a que o evento pertence. */
  teamId: number
  /** Nome do jogador principal do evento. */
  player: string
  /** Jogador secundário (assistência ou quem sai na substituição). */
  relatedPlayer?: string
}

/** Time (referência leve dentro de um jogo). */
export interface MatchTeam {
  countryId: number
  name: string
  code: string
  flag: string
  /** Gols marcados (null se o jogo não começou). */
  score: number | null
}

/** Estatísticas agregadas de um time em um jogo. */
export interface TeamMatchStats {
  possession: number // %
  shots: number
  shotsOnTarget: number
  corners: number
  fouls: number
  yellowCards: number
  redCards: number
  offsides: number
  passes: number
  passAccuracy: number // %
}

/** Um jogador escalado. */
export interface LineupPlayer {
  number: number
  name: string
  position: string // Ex.: "GOL", "ZAG", "MEI", "ATA"
  /** true se for titular. */
  starter: boolean
  captain?: boolean
}

/** Escalação de um time num jogo. */
export interface Lineup {
  formation: string // Ex.: "4-3-3"
  coach: string
  players: LineupPlayer[]
}

/** Um jogo / partida. */
export interface Match {
  id: number
  /** Data/hora de início no formato ISO 8601. */
  date: string
  status: MatchStatus
  /** Minuto atual quando ao vivo. Ex.: 67 */
  minute?: number
  stage: Stage
  group?: string
  home: MatchTeam
  away: MatchTeam
  stadiumId: number
  /** Linha do tempo dos eventos (ordenada por minuto). */
  events: MatchEvent[]
  /** Estatísticas por time (chave = countryId). */
  stats?: Record<number, TeamMatchStats>
  /** Escalações por time (chave = countryId). */
  lineups?: Record<number, Lineup>
}

/** Linha da tabela de classificação de um grupo. */
export interface StandingRow {
  countryId: number
  position: number
  played: number
  won: number
  drawn: number
  lost: number
  goalsFor: number
  goalsAgainst: number
  goalDifference: number
  points: number
  /** Forma recente: array de 'V' | 'E' | 'D'. */
  form: Array<'V' | 'E' | 'D'>
}

/** Tabela completa de um grupo. */
export interface GroupStanding {
  group: string
  rows: StandingRow[]
}

/** Categoria de ranking de jogadores. */
export type StatCategory = 'gols' | 'assistencias' | 'cartoes-amarelos' | 'cartoes-vermelhos'

/** Estatística acumulada de um jogador no torneio. */
export interface PlayerStat {
  playerId: number
  name: string
  countryId: number
  countryName: string
  countryFlag: string
  position: string
  /** Valor da estatística (nº de gols, assistências, cartões…). */
  value: number
  matchesPlayed: number
}

/** Erro de domínio padronizado, com mensagem amigável em PT-BR. */
export interface AppError {
  message: string
  code?: string
}

// ──────────────────────────────────────────────────────────────────────────
// Chaves / mata-mata (fases eliminatórias)
// ──────────────────────────────────────────────────────────────────────────

/** Um confronto no chaveamento eliminatório. */
export interface BracketMatch {
  id: string
  /** Rótulo do lado de cima. Ex.: "1º Grupo A" ou nome da seleção, se definido. */
  homeLabel: string
  /** Rótulo do lado de baixo. Ex.: "3º Grupo C/D/F". */
  awayLabel: string
  /** Referências de país, quando já definidos. */
  homeCountryId?: number
  awayCountryId?: number
  /** Placar, quando o jogo foi disputado. */
  homeScore?: number
  awayScore?: number
}

/** Uma rodada do mata-mata (16-avos, oitavas, etc.). */
export interface BracketRound {
  stage: Stage
  matches: BracketMatch[]
}
