<script setup lang="ts">
import { computed } from 'vue'
import type { BracketRound } from '@/types'
import { countryById } from '@/data/countries'
import CountryFlag from '@/components/ui/CountryFlag.vue'

/**
 * Chaveamento eliminatório no mesmo visual dos cards do app, apenas com as
 * LINHAS conectando cada confronto à fase seguinte.
 *
 * Para as linhas casarem com os pares certos, cada coluna é reordenada para a
 * ordem visual da árvore (pares adjacentes 0-1, 2-3, … alimentam o confronto
 * seguinte na ordem) e cada confronto ocupa fração igual da coluna (`flex: 1`),
 * o que faz o centro do confronto-pai cair no ponto médio do par filho.
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

  const sources = rounds.map((r, ri) =>
    ri === 0
      ? []
      : r.matches.map((m) => {
          const h = trailing(m.homeLabel)
          const a = trailing(m.awayLabel)
          return [h != null ? h - 1 : -1, a != null ? a - 1 : -1]
        }),
  )

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
</script>

<template>
  <div class="overflow-x-auto pb-4">
    <div class="kb flex min-w-max">
      <div
        v-for="(col, ci) in columns"
        :key="col.stage"
        class="kb-round flex shrink-0 flex-col"
        :class="{ 'kb-round--last': ci === columns.length - 1 }"
      >
        <h3 class="mb-3 text-center text-xs font-bold uppercase tracking-wider text-secondary">
          {{ col.stage }}
        </h3>

        <div class="kb-round__matches flex flex-1 flex-col">
          <div v-for="m in col.matches" :key="m.id" class="kb-match">
            <div class="kb-card card-base w-full p-3 animate-fade-in">
              <div class="flex items-center justify-between gap-2 px-2 py-1.5 text-sm">
                <span class="flex items-center gap-2 truncate">
                  <CountryFlag v-if="m.homeCountryId" :country-id="m.homeCountryId" size="sm" />
                  <span
                    class="truncate font-medium"
                    :class="m.homeCountryId ? 'text-dark' : 'text-slate-400'"
                  >
                    {{ m.homeCountryId ? name(m.homeCountryId) : m.homeLabel }}
                  </span>
                </span>
                <span v-if="m.homeScore != null" class="font-bold tabular-nums">{{ m.homeScore }}</span>
              </div>

              <div class="my-1 border-t border-dashed border-black/5"></div>

              <div class="flex items-center justify-between gap-2 px-2 py-1.5 text-sm">
                <span class="flex items-center gap-2 truncate">
                  <CountryFlag v-if="m.awayCountryId" :country-id="m.awayCountryId" size="sm" />
                  <span
                    class="truncate font-medium"
                    :class="m.awayCountryId ? 'text-dark' : 'text-slate-400'"
                  >
                    {{ m.awayCountryId ? name(m.awayCountryId) : m.awayLabel }}
                  </span>
                </span>
                <span v-if="m.awayScore != null" class="font-bold tabular-nums">{{ m.awayScore }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kb {
  --gap: 1.75rem; /* zona das linhas entre colunas */
  --w: 14rem; /* largura do card */
  --line: #cbd5e1; /* slate-300 */
  align-items: stretch;
}

.kb-round {
  width: calc(var(--w) + var(--gap));
  padding-right: var(--gap);
}
.kb-round--last {
  width: var(--w);
  padding-right: 0;
}

/* Cada confronto ocupa fração igual da coluna → centros alinham com os pares.
   O slot é mais alto que o card (que fica centralizado), criando o espaçamento
   entre os balões sem deslocar o centro — os conectores seguem no meio do card. */
.kb-match {
  flex: 1 1 0;
  min-height: 7.5rem;
  display: flex;
  align-items: center;
  position: relative;
}

.kb-card {
  position: relative;
  z-index: 1;
}

/* ── Linhas conectoras ─────────────────────────────────────────── */
/* Horizontal: do card até a borda da próxima coluna, no centro do card. */
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
/* Vertical: liga o par, na borda da próxima coluna (metade de cima + de baixo). */
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
</style>
