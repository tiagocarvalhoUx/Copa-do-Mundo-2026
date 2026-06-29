import type { BracketRound, GroupStanding, Match, StandingRow } from '@/types'
import { countryById } from './countries'

/**
 * Chaveamento do mata-mata da Copa 2026.
 *
 * Formato: 48 seleções → avançam os 2 primeiros de cada grupo (24) + os 8
 * melhores terceiros = 32 seleções, que disputam os 16-avos de final.
 *
 * A ESTRUTURA (seedings por posição de grupo) é curada aqui; os CONFRONTOS
 * reais são DERIVADOS da classificação (`buildBracket`): assim que um grupo
 * termina, o 1º/2º colocado preenche automaticamente as vagas. Os 8 melhores
 * terceiros só são alocados quando os 12 grupos terminam (regra da FIFA).
 */

/**
 * 16-avos de final — os 16 confrontos OFICIAIS da Copa 2026 (jogos 73–88),
 * na ordem oficial. Cada vaga "3º X/Y/..." lista os 5 grupos candidatos ao
 * melhor-terceiro daquela chave, conforme o regulamento da FIFA (Anexo C).
 * As chaves são numeradas 1–16 nesta ordem; as fases seguintes referenciam
 * o "Vencedor N" da chave correspondente.
 */
const dezesseisAvos = [
  ['2º A', '2º B'], //  1 · jogo 73
  ['1º E', '3º A/B/C/D/F'], //  2 · jogo 74
  ['1º F', '2º C'], //  3 · jogo 75
  ['1º C', '2º F'], //  4 · jogo 76
  ['1º I', '3º C/D/F/G/H'], //  5 · jogo 77
  ['2º E', '2º I'], //  6 · jogo 78
  ['1º A', '3º C/E/F/H/I'], //  7 · jogo 79
  ['1º L', '3º E/H/I/J/K'], //  8 · jogo 80
  ['1º D', '3º B/E/F/I/J'], //  9 · jogo 81
  ['1º G', '3º A/E/H/I/J'], // 10 · jogo 82
  ['2º K', '2º L'], // 11 · jogo 83
  ['1º H', '2º J'], // 12 · jogo 84
  ['1º B', '3º E/F/G/I/J'], // 13 · jogo 85
  ['1º J', '2º H'], // 14 · jogo 86
  ['1º K', '3º D/E/I/J/L'], // 15 · jogo 87
  ['2º D', '2º G'], // 16 · jogo 88
] as const

/** Pares de chaves que se cruzam nas oitavas (índices 1-based das chaves). */
const oitavasPairs = [
  [2, 5], // jogo 89
  [1, 3], // jogo 90
  [4, 6], // jogo 91
  [7, 8], // jogo 92
  [11, 12], // jogo 93
  [9, 10], // jogo 94
  [14, 16], // jogo 95
  [13, 15], // jogo 96
] as const

/** Pares de oitavas que se cruzam nas quartas (índices 1-based das oitavas). */
const quartasPairs = [
  [1, 2], // jogo 97
  [5, 6], // jogo 98
  [3, 4], // jogo 99
  [7, 8], // jogo 100
] as const

/** Pares de quartas que se cruzam nas semifinais (índices 1-based das quartas). */
const semisPairs = [
  [1, 2], // jogo 101
  [3, 4], // jogo 102
] as const

function buildRounds(): BracketRound[] {
  const r32: BracketRound = {
    stage: '16-avos de Final',
    matches: dezesseisAvos.map(([h, a], i) => ({
      id: `r32-${i + 1}`,
      homeLabel: h,
      awayLabel: a,
    })),
  }

  const oitavas: BracketRound = {
    stage: 'Oitavas de Final',
    matches: oitavasPairs.map(([h, a], i) => ({
      id: `r16-${i + 1}`,
      homeLabel: `Vencedor ${h}`,
      awayLabel: `Vencedor ${a}`,
    })),
  }

  const quartas: BracketRound = {
    stage: 'Quartas de Final',
    matches: quartasPairs.map(([h, a], i) => ({
      id: `qf-${i + 1}`,
      homeLabel: `Vencedor Oitavas ${h}`,
      awayLabel: `Vencedor Oitavas ${a}`,
    })),
  }

  const semis: BracketRound = {
    stage: 'Semifinal',
    matches: semisPairs.map(([h, a], i) => ({
      id: `sf-${i + 1}`,
      homeLabel: `Vencedor Quartas ${h}`,
      awayLabel: `Vencedor Quartas ${a}`,
    })),
  }

  const final: BracketRound = {
    stage: 'Final',
    matches: [{ id: 'final', homeLabel: 'Vencedor Semi 1', awayLabel: 'Vencedor Semi 2' }],
  }

  return [r32, oitavas, quartas, semis, final]
}

// ── Resolução dinâmica a partir da classificação ──────────────────────────

/** "1º A" / "2º F" → posição (1|2) + letra do grupo. */
const POS_RE = /^([12])º\s+([A-L])$/
/** "3º C/E/F/H" → conjunto de grupos candidatos ao melhor-terceiro. */
const THIRD_RE = /^3º\s+([A-L](?:\/[A-L])*)$/

/** Critério de desempate da classificação: pts → SG → GP → ranking FIFA. */
function compareRows(x: StandingRow, y: StandingRow): number {
  return (
    y.points - x.points ||
    y.goalDifference - x.goalDifference ||
    y.goalsFor - x.goalsFor ||
    (countryById.get(x.countryId)?.fifaRanking ?? 999) -
      (countryById.get(y.countryId)?.fifaRanking ?? 999)
  )
}

/** Um grupo está decidido quando todas as seleções jogaram suas 3 partidas. */
function isComplete(g?: GroupStanding): boolean {
  return !!g && g.rows.length >= 3 && g.rows.every((r) => r.played >= 3)
}

/**
 * Aloca os 8 melhores terceiros aos respectivos confrontos via emparelhamento
 * (cada vaga "3º X/Y/..." só aceita terceiros dos grupos listados; cada grupo
 * é usado uma única vez). Retorna o mapa vaga→countryId resolvido.
 */
function allocateThirds(
  slots: { id: string; groups: string[] }[],
  qualifiedGroups: Set<string>,
  thirdByGroup: Map<string, number>,
): Map<string, number> {
  // Emparelhamento bipartido (caminho aumentante) entre vagas e grupos.
  const assignedGroupToSlot = new Map<string, string>() // grupo → slotId
  const slotToGroup = new Map<string, string>()

  function tryAssign(slotId: string, candidates: string[], seen: Set<string>): boolean {
    for (const grp of candidates) {
      if (!qualifiedGroups.has(grp) || seen.has(grp)) continue
      seen.add(grp)
      const occupant = assignedGroupToSlot.get(grp)
      if (occupant == null || tryAssign(occupant, slotCandidates(occupant), seen)) {
        assignedGroupToSlot.set(grp, slotId)
        slotToGroup.set(slotId, grp)
        return true
      }
    }
    return false
  }
  const slotCandidates = (slotId: string) => slots.find((s) => s.id === slotId)!.groups

  for (const slot of slots) tryAssign(slot.id, slot.groups, new Set())

  const resolved = new Map<string, number>()
  for (const [slotId, grp] of slotToGroup) {
    const id = thirdByGroup.get(grp)
    if (id != null) resolved.set(slotId, id)
  }
  return resolved
}

/** Vencedor de um jogo do mata-mata (inclui pênaltis, via flag `winner`). */
function winnerOf(m: Match): number | undefined {
  if (m.home.winner) return m.home.countryId
  if (m.away.winner) return m.away.countryId
  if (
    m.status === 'encerrado' &&
    m.home.score != null &&
    m.away.score != null &&
    m.home.score !== m.away.score
  ) {
    return m.home.score > m.away.score ? m.home.countryId : m.away.countryId
  }
  return undefined
}

/** Número final de um rótulo "Vencedor N" / "Vencedor Oitavas N". */
function trailingNumber(label: string): number | undefined {
  const m = /(\d+)\s*$/.exec(label)
  return m ? Number(m[1]) : undefined
}

/**
 * Constrói o chaveamento resolvendo os confrontos contra a `standings` e os
 * `knockoutMatches` reais:
 *   1. 1º/2º de cada grupo encerrado preenchem as vagas;
 *   2. os 8 melhores terceiros entram quando todos os grupos terminam;
 *   3. os jogos reais do mata-mata SOBREPÕEM os 16-avos (autoritativo) e
 *      propagam os vencedores às oitavas, quartas, semifinais e final, com placar.
 * Vagas ainda indefinidas permanecem como rótulo.
 */
export function buildBracket(
  standings: GroupStanding[] = [],
  knockoutMatches: Match[] = [],
): BracketRound[] {
  const rounds = buildRounds()
  if (!standings.length) return rounds

  const byGroup = new Map<string, GroupStanding>()
  for (const g of standings) byGroup.set(g.group, g)

  // Seed de cada seleção: posição (1..) + grupo — usado para casar os jogos reais.
  const seedByCountry = new Map<number, { pos: number; group: string }>()
  for (const g of standings) {
    g.rows.forEach((r, i) => seedByCountry.set(r.countryId, { pos: i + 1, group: g.group }))
  }

  // 1º / 2º colocados — resolvidos assim que o grupo termina.
  const positionTeam = (label: string): number | undefined => {
    const m = POS_RE.exec(label)
    if (!m) return undefined
    const g = byGroup.get(m[2])
    if (!isComplete(g)) return undefined
    return g!.rows[Number(m[1]) - 1]?.countryId
  }

  const r32 = rounds[0]
  for (const match of r32.matches) {
    const h = positionTeam(match.homeLabel)
    if (h != null) match.homeCountryId = h
    const a = positionTeam(match.awayLabel)
    if (a != null) match.awayCountryId = a
  }

  // 8 melhores terceiros — só quando TODOS os grupos terminaram.
  const allGroups = [...byGroup.values()]
  const allComplete = allGroups.length >= 12 && allGroups.every(isComplete)
  if (allComplete) {
    const thirds = allGroups
      .map((g) => ({ group: g.group, row: g.rows[2] }))
      .filter((t) => t.row != null)
    const ranked = [...thirds].sort((a, b) => compareRows(a.row, b.row))
    const qualified = new Set(ranked.slice(0, 8).map((t) => t.group))
    const thirdByGroup = new Map(thirds.map((t) => [t.group, t.row.countryId]))

    const slots: { id: string; groups: string[] }[] = []
    for (const match of r32.matches) {
      for (const side of ['homeLabel', 'awayLabel'] as const) {
        const m = THIRD_RE.exec(match[side])
        if (m) slots.push({ id: `${match.id}:${side}`, groups: m[1].split('/') })
      }
    }
    const resolved = allocateThirds(slots, qualified, thirdByGroup)
    for (const match of r32.matches) {
      const h = resolved.get(`${match.id}:homeLabel`)
      if (h != null) match.homeCountryId = h
      const a = resolved.get(`${match.id}:awayLabel`)
      if (a != null) match.awayCountryId = a
    }
  }

  // Resultados reais do mata-mata: placares + propagação dos vencedores.
  if (!knockoutMatches.length) return rounds

  const byStage = new Map<string, Match[]>()
  for (const m of knockoutMatches) {
    const list = byStage.get(m.stage) ?? []
    list.push(m)
    byStage.set(m.stage, list)
  }

  // 16-avos: cada vaga 1º/2º aparece uma única vez, então o jogo real é
  // localizado pela seleção concreta (1º/2º) e SOBREPÕE o seeding derivado.
  const concreteIndex = new Map<string, number>() // "1|A" → índice da chave
  r32.matches.forEach((match, i) => {
    for (const label of [match.homeLabel, match.awayLabel]) {
      const pm = POS_RE.exec(label)
      if (pm) concreteIndex.set(`${pm[1]}|${pm[2]}`, i)
    }
  })
  const locateChave = (m: Match): number | undefined => {
    for (const t of [m.home, m.away]) {
      const s = seedByCountry.get(t.countryId)
      if (s && s.pos <= 2) {
        const idx = concreteIndex.get(`${s.pos}|${s.group}`)
        if (idx != null) return idx
      }
    }
    return undefined
  }

  let prevWinners = new Map<number, number>() // nº do confronto na rodada → vencedor
  for (const real of byStage.get('16-avos de Final') ?? []) {
    const idx = locateChave(real)
    if (idx == null) continue
    const chave = r32.matches[idx]
    chave.homeCountryId = real.home.countryId
    chave.awayCountryId = real.away.countryId
    if (real.home.score != null) chave.homeScore = real.home.score
    if (real.away.score != null) chave.awayScore = real.away.score
    const w = winnerOf(real)
    if (w != null) prevWinners.set(idx + 1, w)
  }

  // Oitavas → Final: resolve os times via "Vencedor N" e casa o jogo real pelo
  // par de seleções, preenchendo placar e apurando o vencedor para a próxima fase.
  for (let ri = 1; ri < rounds.length; ri++) {
    const round = rounds[ri]
    const reals = byStage.get(round.stage) ?? []
    const winners = new Map<number, number>()
    round.matches.forEach((match, mi) => {
      const hn = trailingNumber(match.homeLabel)
      const an = trailingNumber(match.awayLabel)
      if (hn != null && prevWinners.has(hn)) match.homeCountryId = prevWinners.get(hn)
      if (an != null && prevWinners.has(an)) match.awayCountryId = prevWinners.get(an)
      if (match.homeCountryId == null || match.awayCountryId == null) return

      const real = reals.find(
        (r) =>
          (r.home.countryId === match.homeCountryId && r.away.countryId === match.awayCountryId) ||
          (r.home.countryId === match.awayCountryId && r.away.countryId === match.homeCountryId),
      )
      if (real) {
        if (real.home.countryId === match.homeCountryId) {
          if (real.home.score != null) match.homeScore = real.home.score
          if (real.away.score != null) match.awayScore = real.away.score
        } else {
          if (real.away.score != null) match.homeScore = real.away.score
          if (real.home.score != null) match.awayScore = real.home.score
        }
        const w = winnerOf(real)
        if (w != null) winners.set(mi + 1, w)
      }
    })
    prevWinners = winners
  }

  return rounds
}

/** Estrutura estática (sem resolução) — usada como ponto de partida. */
export const bracket: BracketRound[] = buildRounds()
