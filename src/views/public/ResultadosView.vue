<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Match, MatchStatus } from '@/types'
import { useGameStore } from '@/stores/gameStore'
import { useStadiumStore } from '@/stores/stadiumStore'
import { useFormatters } from '@/composables/useFormatters'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import MatchCard from '@/components/ui/MatchCard.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import StateMessage from '@/components/ui/StateMessage.vue'

const game = useGameStore()
const stadiums = useStadiumStore()
const { formatFull } = useFormatters()

type Filter = 'todos' | 'ao-vivo' | 'encerrado' | 'agendado'
const filter = ref<Filter>('todos')

const filters: { key: Filter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'ao-vivo', label: 'Ao vivo' },
  { key: 'encerrado', label: 'Encerrados' },
  { key: 'agendado', label: 'Agendados' },
]

const stadiumName = (id: number) => stadiums.stadiumById(id)?.name

const filtered = computed<Match[]>(() => {
  if (filter.value === 'todos') return game.matches
  const target: MatchStatus = filter.value
  return game.matches.filter((m) =>
    target === 'ao-vivo' ? m.status === 'ao-vivo' || m.status === 'intervalo' : m.status === target,
  )
})

/** Agrupa por dia (rótulo legível) preservando ordem cronológica. */
const grouped = computed(() => {
  const map = new Map<string, Match[]>()
  for (const m of filtered.value) {
    const day = new Date(m.date).toDateString()
    if (!map.has(day)) map.set(day, [])
    map.get(day)!.push(m)
  }
  return [...map.entries()].map(([, list]) => ({
    label: formatFull(list[0].date).split(',')[0],
    matches: list,
  }))
})

function countFor(key: Filter): number {
  if (key === 'todos') return game.matches.length
  if (key === 'ao-vivo') return game.liveMatches.length
  return game.matches.filter((m) => m.status === key).length
}

async function load() {
  await Promise.all([game.fetchMatches(), stadiums.fetchStadiums()])
}
onMounted(load)
</script>

<template>
  <div class="container-app py-12">
    <SectionHeading title="Resultados" subtitle="Todos os jogos da Copa do Mundo 2026" />

    <!-- Filtros -->
    <div class="mb-8 flex flex-wrap gap-2">
      <button
        v-for="f in filters"
        :key="f.key"
        class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all"
        :class="
          filter === f.key
            ? 'bg-secondary text-white shadow-sm'
            : 'bg-white text-slate-500 ring-1 ring-black/5 hover:bg-slate-50'
        "
        @click="filter = f.key"
      >
        <span
          v-if="f.key === 'ao-vivo' && countFor('ao-vivo')"
          class="h-2 w-2 animate-pulse-live rounded-full bg-danger"
        ></span>
        {{ f.label }}
        <span
          class="rounded-full px-1.5 text-xs"
          :class="filter === f.key ? 'bg-white/20' : 'bg-slate-100'"
        >
          {{ countFor(f.key) }}
        </span>
      </button>
    </div>

    <!-- Conteúdo -->
    <StateMessage
      v-if="game.error && !game.loading"
      variant="erro"
      title="Erro ao carregar os jogos"
      :message="game.error"
      retryable
      @retry="load"
    />

    <div v-else-if="game.loading" class="grid gap-4 sm:grid-cols-2">
      <SkeletonCard v-for="i in 6" :key="i" />
    </div>

    <StateMessage
      v-else-if="!filtered.length"
      title="Nenhum jogo neste filtro"
      message="Tente selecionar outra categoria acima."
    />

    <div v-else class="space-y-10">
      <section v-for="(group, i) in grouped" :key="i">
        <h3 class="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-400">
          <span class="h-px flex-1 bg-slate-200"></span>
          {{ group.label }}
          <span class="h-px flex-1 bg-slate-200"></span>
        </h3>
        <div class="grid gap-4 sm:grid-cols-2">
          <MatchCard
            v-for="m in group.matches"
            :key="m.id"
            :match="m"
            :stadium-name="stadiumName(m.stadiumId)"
          />
        </div>
      </section>
    </div>
  </div>
</template>
