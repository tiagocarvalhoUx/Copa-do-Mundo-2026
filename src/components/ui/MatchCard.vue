<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Match } from '@/types'
import { useFormatters } from '@/composables/useFormatters'
import LiveBadge from './LiveBadge.vue'
import CountryFlag from './CountryFlag.vue'

const props = defineProps<{ match: Match; stadiumName?: string }>()
const { formatDate, formatTime } = useFormatters()

const isLive = computed(
  () => props.match.status === 'ao-vivo' || props.match.status === 'intervalo',
)
const notStarted = computed(() => props.match.home.score === null)

function winnerSide(): 'home' | 'away' | null {
  const { home, away, status } = props.match
  if (status !== 'encerrado' || home.score === null || away.score === null) return null
  if (home.score > away.score) return 'home'
  if (away.score > home.score) return 'away'
  return null
}
const winner = computed(winnerSide)
</script>

<template>
  <RouterLink
    :to="`/jogo/${match.id}`"
    class="card-base group block animate-fade-in p-4 hover:-translate-y-1 hover:shadow-lg"
    :class="isLive ? 'ring-2 ring-danger/30' : 'hover:ring-secondary/30'"
  >
    <!-- Cabeçalho: fase + status -->
    <div class="mb-3 flex items-center justify-between">
      <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {{ match.stage }}<template v-if="match.group"> · Grupo {{ match.group }}</template>
      </span>
      <LiveBadge :status="match.status" :minute="match.minute" />
    </div>

    <!-- Confronto -->
    <div class="flex items-center justify-between gap-3">
      <!-- Mandante -->
      <div class="flex flex-1 items-center gap-2.5">
        <CountryFlag :country-id="match.home.countryId" size="md" />
        <span
          class="truncate font-heading text-base font-semibold"
          :class="winner === 'away' ? 'text-slate-400' : 'text-dark'"
        >
          {{ match.home.name }}
        </span>
      </div>

      <!-- Placar -->
      <div class="shrink-0 text-center">
        <div v-if="notStarted" class="font-heading text-sm font-bold text-secondary">
          {{ formatTime(match.date) }}
        </div>
        <div v-else class="flex items-center gap-1 font-heading text-2xl font-bold tabular-nums">
          <span :class="winner === 'away' ? 'text-slate-400' : 'text-dark'">{{ match.home.score }}</span>
          <span class="text-slate-300">·</span>
          <span :class="winner === 'home' ? 'text-slate-400' : 'text-dark'">{{ match.away.score }}</span>
        </div>
      </div>

      <!-- Visitante -->
      <div class="flex flex-1 items-center justify-end gap-2.5 text-right">
        <span
          class="truncate font-heading text-base font-semibold"
          :class="winner === 'home' ? 'text-slate-400' : 'text-dark'"
        >
          {{ match.away.name }}
        </span>
        <CountryFlag :country-id="match.away.countryId" size="md" />
      </div>
    </div>

    <!-- Rodapé: data + estádio -->
    <div class="mt-3 flex items-center justify-between border-t border-black/5 pt-2.5 text-xs text-slate-400">
      <span>{{ formatDate(match.date) }} · {{ formatTime(match.date) }}</span>
      <span v-if="stadiumName" class="flex items-center gap-1 truncate">
        <svg class="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span class="truncate">{{ stadiumName }}</span>
      </span>
    </div>
  </RouterLink>
</template>
