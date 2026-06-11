<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Confederation } from '@/types'
import { useStadiumStore } from '@/stores/stadiumStore'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import StateMessage from '@/components/ui/StateMessage.vue'
import CountryFlag from '@/components/ui/CountryFlag.vue'

const stadiums = useStadiumStore()

const confederations: { key: Confederation | 'todas'; label: string }[] = [
  { key: 'todas', label: 'Todas' },
  { key: 'UEFA', label: 'Europa' },
  { key: 'CONMEBOL', label: 'América do Sul' },
  { key: 'CONCACAF', label: 'América do N./C.' },
  { key: 'CAF', label: 'África' },
  { key: 'AFC', label: 'Ásia' },
]

const filter = ref<Confederation | 'todas'>('todas')

const filtered = computed(() =>
  filter.value === 'todas'
    ? stadiums.countries
    : stadiums.countries.filter((c) => c.confederation === filter.value),
)

onMounted(() => stadiums.fetchCountries())
</script>

<template>
  <div class="container-app py-12">
    <SectionHeading
      title="Países"
      :subtitle="stadiums.countries.length ? `${stadiums.countries.length} seleções participantes` : 'Seleções participantes'"
    />

    <!-- Filtro por confederação -->
    <div class="mb-8 flex flex-wrap gap-2">
      <button
        v-for="c in confederations"
        :key="c.key"
        class="rounded-full px-4 py-2 text-sm font-semibold transition-all"
        :class="filter === c.key ? 'bg-secondary text-white shadow-sm' : 'bg-white text-slate-500 ring-1 ring-black/5 hover:bg-slate-50'"
        @click="filter = c.key"
      >
        {{ c.label }}
      </button>
    </div>

    <StateMessage
      v-if="stadiums.error"
      variant="erro"
      title="Erro ao carregar os países"
      :message="stadiums.error"
      retryable
      @retry="stadiums.fetchCountries()"
    />

    <div v-else-if="stadiums.loading && !stadiums.countries.length" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <div v-for="i in 6" :key="i" class="skeleton h-44 rounded-2xl"></div>
    </div>

    <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <article
        v-for="c in filtered"
        :key="c.id"
        class="card-base p-5 animate-fade-in hover:-translate-y-1 hover:shadow-lg"
      >
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <CountryFlag :country-id="c.id" size="xl" />
            <div>
              <h3 class="font-heading text-lg font-bold text-dark">{{ c.name }}</h3>
              <p class="text-xs text-slate-400">{{ c.nickname }}</p>
            </div>
          </div>
          <span class="rounded-lg bg-secondary/10 px-2 py-1 text-xs font-bold text-secondary">
            Grupo {{ c.group }}
          </span>
        </div>

        <dl class="mt-4 grid grid-cols-3 gap-2 border-t border-black/5 pt-4 text-center">
          <div>
            <dt class="text-xs text-slate-400">Ranking</dt>
            <dd class="font-heading text-lg font-bold text-dark">#{{ c.fifaRanking }}</dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400">Títulos</dt>
            <dd class="font-heading text-lg font-bold" :class="c.titles ? 'text-accent' : 'text-slate-300'">
              {{ c.titles }}<span v-if="c.titles" class="text-sm">🏆</span>
            </dd>
          </div>
          <div>
            <dt class="text-xs text-slate-400">Conf.</dt>
            <dd class="font-heading text-sm font-bold text-dark">{{ c.confederation }}</dd>
          </div>
        </dl>

        <p v-if="c.coach" class="mt-3 text-xs text-slate-500">
          <span class="font-semibold">Treinador:</span> {{ c.coach }}
        </p>
      </article>
    </div>
  </div>
</template>
