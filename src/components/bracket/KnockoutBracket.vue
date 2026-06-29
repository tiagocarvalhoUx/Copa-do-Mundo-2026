<script setup lang="ts">
import { computed } from 'vue'
import type { BracketMatch, BracketRound } from '@/types'
import { countryById } from '@/data/countries'
import CountryFlag from '@/components/ui/CountryFlag.vue'

/**
 * Chaveamento eliminatório com linhas conectoras de torneio.
 *
 * Técnica: cada confronto ocupa uma fração IGUAL da altura da coluna
 * (`flex: 1`). Assim, o centro de um confronto da rodada seguinte cai
 * exatamente no ponto médio do par que o alimenta — e os conectores
 * (pseudo-elementos) alinham sozinhos, independentemente da altura do card.
 *
 * Para isso funcionar, cada coluna é reordenada para a ORDEM VISUAL da árvore
 * (pares adjacentes 0-1, 2-3, … alimentam o confronto seguinte na ordem).
 */
const props = defineProps<{ rounds: BracketRound[] }>()

const name = (id?: number) => (id != null ? countryById.get(id)?.name ?? '' : '')

function trailing(label: string): number | null {
  const m = /(\d+)\s*$/.exec(label)
  return m ? Number(m[1]) : null
}

/** Rodadas reordenadas para a ordem visual da árvore. */
const columns = computed(() => {
  const rounds = props.rounds
  if (rounds.length < 2) return rounds.map((r) => ({ stage: r.stage, matches: r.matches }))

  // sources[ri][idxLógico] = [idxCasa, idxFora] (0-based) na rodada ri-1.
  const sources = rounds.map((r, ri) =>
    ri === 0
      ? []
      : r.matches.map((m) => {
          const h = trailing(m.homeLabel)
          const a = trailing(m.awayLabel)
          return [h != null ? h - 1 : -1, a != null ? a - 1 : -1]
        }),
  )

  // Ordem visual: parte da última rodada e expande pelos confrontos de origem.
  const order: number[][] = rounds.map(() => [])
  const last = rounds.length - 1
  order[last] = rounds[last].matches.map((_, i) => i)
  for (let ri = last; ri >= 1; ri--) {
    const child: number[] = []
    for (const idx of order[ri]) {
      const src = sources[ri][idx] ?? [-1, -1]
      child.push(src[0], src[1])
    }
    order[ri - 1] = child
  }

  // Segurança: ordem inconsistente → mantém a ordem original.
  const valid = order.every(
    (o, ri) => o.length === rounds[ri].matches.length && o.every((i) => i >= 0),
  )
  return rounds.map((r, ri) => ({
    stage: r.stage,
    matches: (valid ? order[ri] : r.matches.map((_, i) => i))
      .map((i) => r.matches[i])
      .filter(Boolean),
  }))
})

const champion = computed(() => props.rounds.at(-1)?.matches[0]?.winnerCountryId)

/** Linhas (casa/fora) de um confronto. */
const sidesOf = (m: BracketMatch) => [
  { id: m.homeCountryId, label: m.homeLabel, score: m.homeScore },
  { id: m.awayCountryId, label: m.awayLabel, score: m.awayScore },
]

function teamState(m: BracketMatch, id?: number): 'win' | 'out' | '' {
  if (m.winnerCountryId == null || id == null) return ''
  return id === m.winnerCountryId ? 'win' : 'out'
}
</script>

<template>
  <div class="kb-scroll">
    <div class="kb">
      <div
        v-for="(col, ci) in columns"
        :key="col.stage"
        class="kb-round"
        :class="{ 'kb-round--last': ci === columns.length - 1 }"
      >
        <div class="kb-round__title">{{ col.stage }}</div>

        <div class="kb-round__matches">
          <div
            v-for="m in col.matches"
            :key="m.id"
            class="kb-match"
            :class="{ 'kb-match--decided': m.winnerCountryId != null }"
          >
            <div class="kb-card" :class="{ 'kb-card--final': ci === columns.length - 1 }">
              <div
                v-for="(s, si) in sidesOf(m)"
                :key="si"
                class="kb-team"
                :class="`kb-team--${teamState(m, s.id) || 'tbd'}`"
              >
                <CountryFlag v-if="s.id != null" :country-id="s.id" size="sm" />
                <span v-else class="kb-team__dot"></span>
                <span class="kb-team__name" :class="{ 'kb-team__name--label': s.id == null }">
                  {{ s.id != null ? name(s.id) : s.label }}
                </span>
                <span v-if="s.score != null" class="kb-team__score">{{ s.score }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Coluna do campeão -->
      <div v-if="champion != null" class="kb-champion">
        <div class="kb-champion__trophy">🏆</div>
        <div class="kb-champion__label">Campeão</div>
        <CountryFlag :country-id="champion" size="xl" />
        <div class="kb-champion__name">{{ name(champion) }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kb-scroll {
  overflow-x: auto;
  padding-bottom: 1rem;
}

.kb {
  --gap: 2.5rem; /* largura da zona de conectores entre colunas */
  --w: 13.5rem; /* largura do card */
  --line: #cbd5e1; /* slate-300 */
  --line-win: #10b981; /* emerald-500 */
  display: flex;
  align-items: stretch;
  min-width: max-content;
  padding: 0.25rem;
}

/* ── Colunas / rodadas ─────────────────────────────────────────── */
.kb-round {
  display: flex;
  flex-direction: column;
  flex: none;
  width: calc(var(--w) + var(--gap));
  padding-right: var(--gap);
}
.kb-round--last {
  width: var(--w);
  padding-right: 0;
}

.kb-round__title {
  height: 2.25rem;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.6rem;
  background: #1e293b; /* secondary */
  color: #fff;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.kb-round__matches {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* Cada confronto ocupa fração IGUAL da coluna → centros alinham com os pares. */
.kb-match {
  flex: 1 1 0;
  min-height: 4.25rem;
  display: flex;
  align-items: center;
  position: relative;
}

/* ── Conectores ────────────────────────────────────────────────── */
/* Linha horizontal: do card até a borda da próxima coluna, no centro. */
.kb-round:not(.kb-round--last) .kb-match::after {
  content: '';
  position: absolute;
  left: 100%;
  top: 50%;
  width: var(--gap);
  height: 2px;
  background: var(--line);
  transform: translateY(-50%);
}
/* Barra vertical na borda da próxima coluna: metade de cima + metade de baixo. */
.kb-round:not(.kb-round--last) .kb-match::before {
  content: '';
  position: absolute;
  left: calc(100% + var(--gap));
  width: 2px;
  background: var(--line);
}
.kb-round:not(.kb-round--last) .kb-match:nth-child(odd)::before {
  top: 50%;
  height: 50%;
}
.kb-round:not(.kb-round--last) .kb-match:nth-child(even)::before {
  bottom: 50%;
  height: 50%;
}
/* Acende o caminho do confronto já decidido. */
.kb-match--decided::after,
.kb-match--decided::before {
  background: var(--line-win);
}

/* ── Card ──────────────────────────────────────────────────────── */
.kb-card {
  position: relative;
  z-index: 1;
  width: 100%;
  background: #fff;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 0.6rem;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  overflow: hidden;
  transition: box-shadow 0.2s, transform 0.2s;
}
.kb-card:hover {
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
  transform: translateY(-1px);
}
.kb-card--final {
  border-color: #fcd34d;
  box-shadow: 0 6px 20px rgba(251, 191, 36, 0.28);
}

.kb-team {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.6rem;
}
.kb-team + .kb-team {
  border-top: 1px dashed rgba(15, 23, 42, 0.07);
}
.kb-team__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.8rem;
  font-weight: 600;
  color: #1e293b;
}
.kb-team__name--label {
  font-weight: 500;
  color: #94a3b8;
}
.kb-team__score {
  font-size: 0.85rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: #1e293b;
}
.kb-team__dot {
  width: 1.5rem;
  height: 1rem;
  border-radius: 3px;
  background: #e2e8f0;
  flex-shrink: 0;
}

/* Vencedor x eliminado */
.kb-team--win {
  background: rgba(16, 185, 129, 0.08);
}
.kb-team--win .kb-team__name {
  color: #047857;
  font-weight: 800;
}
.kb-team--win .kb-team__score {
  color: #047857;
}
.kb-team--out {
  opacity: 0.55;
}

/* ── Campeão ───────────────────────────────────────────────────── */
.kb-champion {
  align-self: center;
  margin-left: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
  padding: 1.25rem 1.5rem;
  border-radius: 1rem;
  background: linear-gradient(160deg, #fffbeb, #fef3c7);
  border: 1px solid #fcd34d;
  box-shadow: 0 10px 28px rgba(251, 191, 36, 0.32);
}
.kb-champion__trophy {
  font-size: 2.25rem;
  line-height: 1;
}
.kb-champion__label {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #b45309;
}
.kb-champion__name {
  font-size: 0.95rem;
  font-weight: 800;
  color: #92400e;
}
</style>
