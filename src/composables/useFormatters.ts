import type { Match, MatchEventType, MatchStatus } from '@/types'

const dateFmt = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'short',
})

const timeFmt = new Intl.DateTimeFormat('pt-BR', {
  hour: '2-digit',
  minute: '2-digit',
})

const fullFmt = new Intl.DateTimeFormat('pt-BR', {
  weekday: 'long',
  day: '2-digit',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
})

/**
 * Helpers de formatação reutilizáveis em PT-BR.
 * Sem estado reativo — exportados como funções puras.
 */
export function useFormatters() {
  return {
    formatDate: (iso: string) => dateFmt.format(new Date(iso)),
    formatTime: (iso: string) => timeFmt.format(new Date(iso)),
    formatFull: (iso: string) => fullFmt.format(new Date(iso)),

    /** Capacidade com separador de milhar PT-BR. */
    formatNumber: (n: number) => new Intl.NumberFormat('pt-BR').format(n),

    /** Rótulo do status do jogo. */
    statusLabel: (status: MatchStatus, minute?: number): string => {
      switch (status) {
        case 'ao-vivo':
          return minute ? `${minute}'` : 'Ao vivo'
        case 'intervalo':
          return 'Intervalo'
        case 'encerrado':
          return 'Encerrado'
        case 'adiado':
          return 'Adiado'
        default:
          return 'Agendado'
      }
    },

    /** Emoji/ícone textual de um tipo de evento. */
    eventIcon: (type: MatchEventType): string => {
      switch (type) {
        case 'gol':
        case 'penalti':
          return '⚽'
        case 'gol-contra':
          return '🥅'
        case 'cartao-amarelo':
          return '🟨'
        case 'cartao-vermelho':
          return '🟥'
        case 'substituicao':
          return '🔄'
      }
    },

    /** Texto curto do placar (ou "x" se não começou). */
    scoreText: (m: Match): string =>
      m.home.score === null || m.away.score === null
        ? 'x'
        : `${m.home.score} - ${m.away.score}`,
  }
}
