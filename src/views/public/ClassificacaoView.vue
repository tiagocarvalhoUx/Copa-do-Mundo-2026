<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useGameStore } from '@/stores/gameStore'
import { useStadiumStore } from '@/stores/stadiumStore'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import StateMessage from '@/components/ui/StateMessage.vue'
import CountryFlag from '@/components/ui/CountryFlag.vue'
import KnockoutBracket from '@/components/bracket/KnockoutBracket.vue'

const game = useGameStore()
const stadiums = useStadiumStore()

type Tab = 'grupos' | 'chaves'
const tab = ref<Tab>('grupos')

const country = (id: number) => stadiums.countryById(id)

async function load() {
  await Promise.all([
    game.fetchStandings(),
    game.fetchBracket(),
    game.fetchMatches(),
    stadiums.ensureCountries(),
  ])
}

// Atualização silenciosa da classificação e do chaveamento enquanto houver
// jogo ao vivo — ambos só mudam quando um jogo encerra, então não vale a pena
// consultar fora desse período. Mesmo padrão do polling dos Resultados.
// O bracket é recalculado a partir da classificação, então atualizamos a
// standings primeiro e o bracket em seguida.
let timer: number | undefined
function stopPolling() {
  if (timer) window.clearInterval(timer)
  timer = undefined
}
async function refresh() {
  await game.refreshStandings()
  await game.refreshBracket()
}
watch(
  () => game.liveMatches.length > 0,
  (hasLive) => {
    stopPolling()
    if (hasLive) timer = window.setInterval(refresh, 30_000)
  },
  { immediate: true },
)

onMounted(load)
onUnmounted(stopPolling)
</script>

<template>
  <div class="container-app py-12">
    <SectionHeading
      title="Classificação"
      subtitle="Grupos e chaves do mata-mata — avançam os 2 primeiros de cada grupo e os 8 melhores terceiros"
    />

    <!-- Abas -->
    <div class="mb-8 flex w-fit gap-1 rounded-xl bg-slate-100 p-1">
      <button
        v-for="t in (['grupos', 'chaves'] as Tab[])"
        :key="t"
        class="rounded-lg px-5 py-2 text-sm font-semibold capitalize transition-all"
        :class="tab === t ? 'bg-white text-secondary shadow-sm' : 'text-slate-500 hover:text-slate-700'"
        @click="tab = t"
      >
        {{ t === 'grupos' ? 'Grupos' : 'Chaves' }}
      </button>
    </div>

    <StateMessage
      v-if="game.error"
      variant="erro"
      title="Erro ao carregar a classificação"
      :message="game.error"
      retryable
      @retry="load"
    />

    <!-- ───────────────── GRUPOS ───────────────── -->
    <template v-else-if="tab === 'grupos'">
      <div v-if="!game.standings.length" class="grid gap-6 lg:grid-cols-2">
        <div v-for="i in 4" :key="i" class="skeleton h-64 rounded-2xl"></div>
      </div>

      <div v-else class="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div v-for="g in game.standings" :key="g.group" class="card-base overflow-hidden animate-fade-in">
          <div class="flex items-center gap-2 bg-secondary px-5 py-3 text-white">
            <span class="grid h-7 w-7 place-items-center rounded-lg bg-primary font-heading text-sm font-bold text-darkblue">
              {{ g.group }}
            </span>
            <h3 class="font-heading text-lg font-bold tracking-wide">Grupo {{ g.group }}</h3>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-black/5 text-xs uppercase tracking-wider text-slate-400">
                  <th class="px-3 py-2 text-left font-semibold">#</th>
                  <th class="py-2 text-left font-semibold">Seleção</th>
                  <th class="px-2 py-2 text-center font-semibold" title="Jogos">J</th>
                  <th class="px-2 py-2 text-center font-semibold" title="Vitórias">V</th>
                  <th class="px-2 py-2 text-center font-semibold" title="Empates">E</th>
                  <th class="px-2 py-2 text-center font-semibold" title="Derrotas">D</th>
                  <th class="px-2 py-2 text-center font-semibold" title="Saldo de gols">SG</th>
                  <th class="px-3 py-2 text-center font-semibold" title="Pontos">Pts</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in g.rows"
                  :key="row.countryId"
                  class="border-b border-black/5 last:border-0 transition-colors hover:bg-slate-50"
                  :class="row.position <= 2 ? 'bg-emerald-50/40' : ''"
                >
                  <td class="px-3 py-2.5">
                    <span
                      class="grid h-6 w-6 place-items-center rounded-md text-xs font-bold"
                      :class="row.position <= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'"
                    >
                      {{ row.position }}
                    </span>
                  </td>
                  <td class="py-2.5">
                    <div class="flex items-center gap-2.5">
                      <CountryFlag :country-id="row.countryId" size="md" />
                      <span class="truncate font-semibold text-dark">{{ country(row.countryId)?.name }}</span>
                    </div>
                  </td>
                  <td class="px-2 py-2.5 text-center tabular-nums text-slate-500">{{ row.played }}</td>
                  <td class="px-2 py-2.5 text-center tabular-nums text-slate-500">{{ row.won }}</td>
                  <td class="px-2 py-2.5 text-center tabular-nums text-slate-500">{{ row.drawn }}</td>
                  <td class="px-2 py-2.5 text-center tabular-nums text-slate-500">{{ row.lost }}</td>
                  <td
                    class="px-2 py-2.5 text-center tabular-nums font-medium"
                    :class="row.goalDifference > 0 ? 'text-emerald-600' : row.goalDifference < 0 ? 'text-danger' : 'text-slate-500'"
                  >
                    {{ row.goalDifference > 0 ? '+' : '' }}{{ row.goalDifference }}
                  </td>
                  <td class="px-3 py-2.5 text-center font-heading text-base font-bold text-secondary tabular-nums">{{ row.points }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p class="mt-6 flex items-center gap-2 text-xs text-slate-400">
        <span class="h-3 w-3 rounded bg-emerald-500"></span>
        Zona de classificação para o mata-mata
      </p>
    </template>

    <!-- ───────────────── CHAVES (mata-mata) ───────────────── -->
    <template v-else>
      <div v-if="!game.bracket.length" class="skeleton h-96 rounded-2xl"></div>

      <div v-else>
        <p class="mb-4 rounded-xl bg-secondary/5 px-4 py-3 text-sm text-slate-600">
          ℹ️ Os 16-avos são definidos pela classificação dos grupos; os vencedores avançam
          automaticamente pelas oitavas, quartas, semifinais e final conforme os jogos terminam.
        </p>

        <KnockoutBracket :rounds="game.bracket" />
      </div>
    </template>
  </div>
</template>
