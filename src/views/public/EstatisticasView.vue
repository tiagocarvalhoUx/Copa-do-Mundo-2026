<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { StatCategory } from '@/types'
import { usePlayerStore } from '@/stores/playerStore'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import StateMessage from '@/components/ui/StateMessage.vue'
import CountryFlag from '@/components/ui/CountryFlag.vue'

const players = usePlayerStore()

const categories: { key: StatCategory; label: string; icon: string; accent: string }[] = [
  { key: 'gols', label: 'Artilheiros', icon: '⚽', accent: 'text-secondary' },
  { key: 'assistencias', label: 'Assistências', icon: '🅰️', accent: 'text-emerald-600' },
  { key: 'cartoes-amarelos', label: 'Cartões amarelos', icon: '🟨', accent: 'text-amber-500' },
  { key: 'cartoes-vermelhos', label: 'Cartões vermelhos', icon: '🟥', accent: 'text-danger' },
]

const active = ref<StatCategory>('gols')
const ranking = computed(() => players.ranking(active.value))
const unitLabel = computed(() => {
  switch (active.value) {
    case 'gols': return 'gols'
    case 'assistencias': return 'assist.'
    default: return 'cartões'
  }
})

onMounted(() => players.fetchAll())
</script>

<template>
  <div class="container-app py-12">
    <SectionHeading title="Estatísticas" subtitle="Os destaques individuais do torneio" />

    <!-- Seletor de categoria -->
    <div class="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <button
        v-for="c in categories"
        :key="c.key"
        class="flex flex-col items-center gap-1 rounded-xl px-4 py-4 text-sm font-semibold transition-all"
        :class="active === c.key ? 'bg-secondary text-white shadow-md' : 'bg-white text-slate-500 ring-1 ring-black/5 hover:bg-slate-50'"
        @click="active = c.key"
      >
        <span class="text-2xl">{{ c.icon }}</span>
        {{ c.label }}
      </button>
    </div>

    <StateMessage
      v-if="players.error"
      variant="erro"
      title="Erro ao carregar estatísticas"
      :message="players.error"
      retryable
      @retry="players.fetchAll()"
    />

    <div v-else-if="players.loading && !ranking.length" class="space-y-3">
      <div v-for="i in 6" :key="i" class="skeleton h-16 rounded-xl"></div>
    </div>

    <StateMessage v-else-if="!ranking.length" title="Sem dados nesta categoria" />

    <ol v-else class="space-y-2">
      <li
        v-for="(p, i) in ranking"
        :key="p.playerId"
        class="card-base flex items-center gap-4 p-4 animate-fade-in hover:shadow-md"
      >
        <span
          class="grid h-9 w-9 shrink-0 place-items-center rounded-xl font-heading text-lg font-bold"
          :class="i === 0 ? 'bg-primary text-darkblue' : i < 3 ? 'bg-secondary/10 text-secondary' : 'bg-slate-100 text-slate-400'"
        >
          {{ i + 1 }}
        </span>
        <CountryFlag :country-id="p.countryId" size="lg" />
        <div class="min-w-0 flex-1">
          <div class="truncate font-heading text-base font-bold text-dark">{{ p.name }}</div>
          <div class="text-xs text-slate-400">{{ p.countryName }} · {{ p.position }} · {{ p.matchesPlayed }} jogo(s)</div>
        </div>
        <div class="shrink-0 text-right">
          <span class="font-heading text-2xl font-bold tabular-nums" :class="categories.find((c) => c.key === active)?.accent">
            {{ p.value }}
          </span>
          <span class="ml-1 text-xs text-slate-400">{{ unitLabel }}</span>
        </div>
      </li>
    </ol>
  </div>
</template>
