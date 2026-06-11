<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useStadiumStore } from '@/stores/stadiumStore'
import { useGameStore } from '@/stores/gameStore'
import { useFormatters } from '@/composables/useFormatters'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import StateMessage from '@/components/ui/StateMessage.vue'

const stadiums = useStadiumStore()
const game = useGameStore()
const { formatNumber, formatDate } = useFormatters()

const totalCapacity = computed(() => stadiums.stadiums.reduce((sum, s) => sum + s.capacity, 0))

/** Jogos que cada estádio sediará (a partir dos matchIds). */
function matchesOf(matchIds: number[]) {
  return matchIds
    .map((id) => game.matches.find((m) => m.id === id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
}

async function load() {
  await Promise.all([stadiums.fetchStadiums(), game.fetchMatches()])
}
onMounted(load)
</script>

<template>
  <div class="container-app py-12">
    <SectionHeading
      title="Estádios"
      :subtitle="stadiums.stadiums.length ? `${stadiums.stadiums.length} sedes · ${formatNumber(totalCapacity)} lugares no total` : 'Sedes da Copa do Mundo 2026'"
    />

    <StateMessage
      v-if="stadiums.error"
      variant="erro"
      title="Erro ao carregar os estádios"
      :message="stadiums.error"
      retryable
      @retry="load"
    />

    <div v-else-if="stadiums.loading && !stadiums.stadiums.length" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 6" :key="i" class="skeleton h-72 rounded-2xl"></div>
    </div>

    <div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="s in stadiums.stadiums"
        :key="s.id"
        class="card-base group overflow-hidden animate-fade-in hover:-translate-y-1 hover:shadow-lg"
      >
        <div class="relative h-44 overflow-hidden bg-slate-200">
          <img
            :src="s.image"
            :alt="`Estádio ${s.name}`"
            loading="lazy"
            class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3">
            <span class="rounded-full bg-primary px-2.5 py-1 text-xs font-bold text-darkblue">
              {{ s.country }}
            </span>
          </div>
        </div>

        <div class="p-5">
          <h3 class="font-heading text-lg font-bold text-dark">{{ s.name }}</h3>
          <p class="text-sm text-slate-400">📍 {{ s.city }}</p>

          <div class="mt-3 flex items-center gap-4 text-sm">
            <span class="flex items-center gap-1.5 text-slate-600">
              <span class="text-base">👥</span>
              <strong class="font-semibold">{{ formatNumber(s.capacity) }}</strong>
            </span>
            <span v-if="s.opened" class="flex items-center gap-1.5 text-slate-600">
              <span class="text-base">🏟️</span>
              {{ s.opened }}
            </span>
          </div>

          <div v-if="matchesOf(s.matchIds).length" class="mt-4 border-t border-black/5 pt-3">
            <p class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Jogos na sede</p>
            <ul class="space-y-1.5">
              <li
                v-for="m in matchesOf(s.matchIds)"
                :key="m.id"
                class="flex items-center gap-2 text-sm text-slate-600"
              >
                <span>{{ m.home.flag }}</span>
                <span class="truncate">{{ m.home.code }} x {{ m.away.code }}</span>
                <span>{{ m.away.flag }}</span>
                <span class="ml-auto text-xs text-slate-400">{{ formatDate(m.date) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>
