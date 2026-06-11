import type { BracketRound } from '@/types'

/**
 * Chaveamento do mata-mata da Copa 2026.
 *
 * Formato: 48 seleções → avançam os 2 primeiros de cada grupo (24) + os 8
 * melhores terceiros = 32 seleções, que disputam os 16-avos de final.
 *
 * Como a fase de grupos está em andamento, os confrontos ainda não estão
 * definidos: os rótulos indicam a posição de classificação (ex.: "1º A").
 * Quando a API estiver conectada (ou os grupos terminarem), os confrontos
 * reais preenchem `homeCountryId` / `awayCountryId` e os placares.
 */

/** 16-avos de final — 16 confrontos (seedings por posição de grupo). */
const dezesseisAvos = [
  ['1º A', '3º C/E/F/H'],
  ['1º C', '2º F'],
  ['1º E', '2º D'],
  ['1º F', '2º C'],
  ['1º B', '3º A/C/D/F'],
  ['1º D', '2º E'],
  ['1º G', '3º A/B/C/D'],
  ['1º H', '2º J'],
  ['1º I', '3º C/D/F/G'],
  ['1º K', '2º L'],
  ['1º J', '2º H'],
  ['1º L', '2º I'],
  ['2º A', '2º B'],
  ['2º G', '3º E/H/I/J'],
  ['2º K', '3º D/E/I/J'],
  ['1º... ', '3º A/B/E/F'],
] as const

function buildRounds(): BracketRound[] {
  const r32: BracketRound = {
    stage: '16-avos de Final',
    matches: dezesseisAvos.map(([h, a], i) => ({
      id: `r32-${i + 1}`,
      homeLabel: h.trim(),
      awayLabel: a,
    })),
  }

  const oitavas: BracketRound = {
    stage: 'Oitavas de Final',
    matches: Array.from({ length: 8 }, (_, i) => ({
      id: `r16-${i + 1}`,
      homeLabel: `Vencedor ${i * 2 + 1}`,
      awayLabel: `Vencedor ${i * 2 + 2}`,
    })),
  }

  const quartas: BracketRound = {
    stage: 'Quartas de Final',
    matches: Array.from({ length: 4 }, (_, i) => ({
      id: `qf-${i + 1}`,
      homeLabel: `Vencedor Oitavas ${i * 2 + 1}`,
      awayLabel: `Vencedor Oitavas ${i * 2 + 2}`,
    })),
  }

  const semis: BracketRound = {
    stage: 'Semifinal',
    matches: Array.from({ length: 2 }, (_, i) => ({
      id: `sf-${i + 1}`,
      homeLabel: `Vencedor Quartas ${i * 2 + 1}`,
      awayLabel: `Vencedor Quartas ${i * 2 + 2}`,
    })),
  }

  const final: BracketRound = {
    stage: 'Final',
    matches: [{ id: 'final', homeLabel: 'Vencedor Semi 1', awayLabel: 'Vencedor Semi 2' }],
  }

  return [r32, oitavas, quartas, semis, final]
}

export const bracket: BracketRound[] = buildRounds()
