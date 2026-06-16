<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import type { LineupPlayer } from '@/types'
import { useGameStore } from '@/stores/gameStore'
import { useStadiumStore } from '@/stores/stadiumStore'
import { useFormatters } from '@/composables/useFormatters'
import LiveBadge from '@/components/ui/LiveBadge.vue'
import StateMessage from '@/components/ui/StateMessage.vue'
import CountryFlag from '@/components/ui/CountryFlag.vue'

const props = defineProps<{ id: number }>()

const game = useGameStore()
const stadiums = useStadiumStore()
const { formatFull, eventIcon } = useFormatters()

const match = computed(() => game.currentMatch)
const stadium = computed(() => (match.value ? stadiums.stadiumById(match.value.stadiumId) : undefined))
const isLive = computed(() => match.value?.status === 'ao-vivo' || match.value?.status === 'intervalo')

type Tab = 'eventos' | 'escalacoes' | 'estatisticas'
const tab = ref<Tab>('eventos')

// Eventos em ordem decrescente (mais recente primeiro).
const eventsDesc = computed(() => (match.value ? [...match.value.events].sort((a, b) => b.minute - a.minute) : []))

function starters(countryId: number): LineupPlayer[] {
  return match.value?.lineups?.[countryId]?.players.filter((p) => p.starter) ?? []
}
function bench(countryId: number): LineupPlayer[] {
  return match.value?.lineups?.[countryId]?.players.filter((p) => !p.starter) ?? []
}

/** Lista de estatísticas comparativas (label, valor casa, valor visitante). */
const statRows = computed(() => {
  const m = match.value
  if (!m?.stats || !m.home.score && m.home.score !== 0) return []
  const h = m.stats[m.home.countryId]
  const a = m.stats[m.away.countryId]
  if (!h || !a) return []
  return [
    { label: 'Posse de bola', home: `${h.possession}%`, away: `${a.possession}%`, hv: h.possession, av: a.possession },
    { label: 'Finalizações', home: h.shots, away: a.shots, hv: h.shots, av: a.shots },
    { label: 'No alvo', home: h.shotsOnTarget, away: a.shotsOnTarget, hv: h.shotsOnTarget, av: a.shotsOnTarget },
    { label: 'Escanteios', home: h.corners, away: a.corners, hv: h.corners, av: a.corners },
    { label: 'Faltas', home: h.fouls, away: a.fouls, hv: h.fouls, av: a.fouls },
    { label: 'Impedimentos', home: h.offsides, away: a.offsides, hv: h.offsides, av: a.offsides },
    { label: 'Cartões amarelos', home: h.yellowCards, away: a.yellowCards, hv: h.yellowCards, av: a.yellowCards },
    { label: 'Passes certos', home: `${h.passAccuracy}%`, away: `${a.passAccuracy}%`, hv: h.passAccuracy, av: a.passAccuracy },
  ]
})

// Polling em tempo real (5s, silencioso) enquanto o jogo está ao vivo.
let timer: number | undefined
function startPolling() {
  stopPolling()
  if (isLive.value) timer = window.setInterval(() => game.refreshMatch(props.id), 5_000)
}
function stopPolling() {
  if (timer) window.clearInterval(timer)
  timer = undefined
}

async function load() {
  await Promise.all([game.fetchMatch(props.id), stadiums.fetchStadiums()])
  startPolling()
}

watch(() => props.id, load)
watch(isLive, (live) => (live ? startPolling() : stopPolling()))
onMounted(load)
onUnmounted(stopPolling)
</script>

<template>
  <div class="container-app py-8">
    <RouterLink to="/resultados" class="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:underline">
      ← Voltar aos resultados
    </RouterLink>

    <StateMessage
      v-if="game.error && !game.loading"
      variant="erro"
      title="Jogo não encontrado"
      :message="game.error"
      retryable
      @retry="load"
    />

    <div v-else-if="game.loading || !match" class="space-y-6">
      <div class="skeleton h-48 rounded-2xl"></div>
      <div class="skeleton h-64 rounded-2xl"></div>
    </div>

    <template v-else>
      <!-- Placar principal -->
      <div class="overflow-hidden rounded-2xl bg-gradient-to-br from-secondary to-secondary-dark text-white shadow-lg">
        <div class="flex items-center justify-between px-6 pt-5 text-xs font-semibold uppercase tracking-wider text-white/70">
          <span>{{ match.stage }}<template v-if="match.group"> · Grupo {{ match.group }}</template></span>
          <LiveBadge :status="match.status" :minute="match.minute" />
        </div>

        <div class="grid grid-cols-3 items-center gap-2 px-6 py-8">
          <!-- Mandante -->
          <div class="flex flex-col items-center gap-2 text-center">
            <CountryFlag :country-id="match.home.countryId" size="xl" />
            <span class="font-heading text-lg font-bold sm:text-xl">{{ match.home.name }}</span>
          </div>

          <!-- Placar -->
          <div class="text-center">
            <div v-if="match.home.score !== null" class="font-heading text-5xl font-bold tabular-nums sm:text-6xl">
              {{ match.home.score }} <span class="text-white/40">:</span> {{ match.away.score }}
            </div>
            <div v-else class="font-heading text-3xl font-bold">VS</div>
            <div class="mt-2 text-xs text-white/60">{{ formatFull(match.date) }}</div>
          </div>

          <!-- Visitante -->
          <div class="flex flex-col items-center gap-2 text-center">
            <CountryFlag :country-id="match.away.countryId" size="xl" />
            <span class="font-heading text-lg font-bold sm:text-xl">{{ match.away.name }}</span>
          </div>
        </div>

        <!-- Estádio -->
        <div v-if="stadium || match.venue" class="flex items-center justify-center gap-2 border-t border-white/10 bg-black/10 px-6 py-3 text-sm text-white/80">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <template v-if="stadium">{{ stadium.name }} · {{ stadium.city }}, {{ stadium.country }}</template>
          <template v-else>{{ match.venue }}</template>
        </div>
      </div>

      <!-- Atualização ao vivo -->
      <p v-if="isLive" class="mt-3 flex items-center justify-center gap-2 text-xs text-slate-400">
        <span class="h-1.5 w-1.5 animate-pulse-live rounded-full bg-danger"></span>
        Atualizando automaticamente a cada 5 segundos
      </p>

      <!-- Abas -->
      <div class="mt-6 flex gap-1 rounded-xl bg-slate-100 p-1">
        <button
          v-for="t in (['eventos', 'escalacoes', 'estatisticas'] as Tab[])"
          :key="t"
          class="flex-1 rounded-lg px-3 py-2 text-sm font-semibold capitalize transition-all"
          :class="tab === t ? 'bg-white text-secondary shadow-sm' : 'text-slate-500 hover:text-slate-700'"
          @click="tab = t"
        >
          {{ t === 'escalacoes' ? 'Escalações' : t === 'estatisticas' ? 'Estatísticas' : 'Eventos' }}
        </button>
      </div>

      <!-- EVENTOS -->
      <div v-if="tab === 'eventos'" class="mt-6">
        <div v-if="eventsDesc.length" class="card-base p-2">
          <ul class="divide-y divide-black/5">
            <li
              v-for="e in eventsDesc"
              :key="e.id"
              class="flex items-center gap-3 px-3 py-3"
              :class="e.teamId === match.away.countryId ? 'flex-row-reverse text-right' : ''"
            >
              <span class="grid h-8 w-12 shrink-0 place-items-center rounded-lg bg-slate-100 font-heading text-sm font-bold tabular-nums text-slate-600">
                {{ e.minute }}'<template v-if="e.extra">+{{ e.extra }}</template>
              </span>
              <span class="text-xl">{{ eventIcon(e.type) }}</span>
              <div class="flex-1" :class="e.teamId === match.away.countryId ? 'text-right' : ''">
                <div class="font-semibold text-dark">{{ e.player }}</div>
                <div v-if="e.relatedPlayer" class="text-xs text-slate-400">
                  {{ e.type === 'substituicao' ? 'sai ' : 'assistência: ' }}{{ e.relatedPlayer }}
                </div>
              </div>
            </li>
          </ul>
        </div>
        <StateMessage v-else title="Sem eventos ainda" message="Os lances aparecerão aqui assim que a bola rolar." />
      </div>

      <!-- ESCALAÇÕES -->
      <div v-else-if="tab === 'escalacoes'" class="mt-6">
        <div v-if="match.lineups" class="grid gap-6 md:grid-cols-2">
          <div v-for="team in [match.home, match.away]" :key="team.countryId" class="card-base p-5">
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <CountryFlag :country-id="team.countryId" size="md" />
                <span class="font-heading font-bold text-dark">{{ team.name }}</span>
              </div>
              <span class="rounded-lg bg-secondary/10 px-2 py-1 text-xs font-bold text-secondary">
                {{ match.lineups[team.countryId]?.formation }}
              </span>
            </div>
            <ul class="space-y-1">
              <li
                v-for="p in starters(team.countryId)"
                :key="p.number"
                class="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50"
              >
                <span class="grid h-7 w-7 place-items-center rounded-full bg-secondary text-xs font-bold text-white">{{ p.number }}</span>
                <span class="font-medium text-dark">{{ p.name }}</span>
                <span v-if="p.captain" class="rounded bg-primary/30 px-1 text-[10px] font-bold text-darkblue">C</span>
                <span class="ml-auto text-xs font-semibold text-slate-400">{{ p.position }}</span>
              </li>
            </ul>
            <div v-if="bench(team.countryId).length" class="mt-4 border-t border-black/5 pt-3">
              <p class="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Banco</p>
              <ul class="space-y-1">
                <li v-for="p in bench(team.countryId)" :key="p.number" class="flex items-center gap-3 px-2 text-sm text-slate-500">
                  <span class="grid h-6 w-6 place-items-center rounded-full bg-slate-200 text-[10px] font-bold">{{ p.number }}</span>
                  {{ p.name }}
                  <span class="ml-auto text-xs">{{ p.position }}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <StateMessage v-else title="Escalações indisponíveis" message="As escalações são divulgadas cerca de 1 hora antes do jogo." />
      </div>

      <!-- ESTATÍSTICAS -->
      <div v-else class="mt-6">
        <div v-if="statRows.length" class="card-base space-y-4 p-6">
          <div class="mb-2 flex items-center justify-between text-sm font-bold text-dark">
            <span class="flex items-center gap-1.5"><CountryFlag :country-id="match.home.countryId" size="sm" /> {{ match.home.code }}</span>
            <span class="flex items-center gap-1.5">{{ match.away.code }} <CountryFlag :country-id="match.away.countryId" size="sm" /></span>
          </div>
          <div v-for="row in statRows" :key="row.label">
            <div class="mb-1 flex items-center justify-between text-sm">
              <span class="font-bold tabular-nums text-dark">{{ row.home }}</span>
              <span class="text-xs font-semibold uppercase tracking-wider text-slate-400">{{ row.label }}</span>
              <span class="font-bold tabular-nums text-dark">{{ row.away }}</span>
            </div>
            <div class="flex h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                class="bg-primary transition-all"
                :style="{ width: `${(row.hv / (row.hv + row.av || 1)) * 100}%` }"
              ></div>
              <div
                class="bg-secondary transition-all"
                :style="{ width: `${(row.av / (row.hv + row.av || 1)) * 100}%` }"
              ></div>
            </div>
          </div>
        </div>
        <StateMessage v-else title="Estatísticas indisponíveis" message="As estatísticas aparecem assim que o jogo começa." />
      </div>
    </template>
  </div>
</template>
