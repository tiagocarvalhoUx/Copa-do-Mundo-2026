<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useGameStore } from '@/stores/gameStore'
import { useStadiumStore } from '@/stores/stadiumStore'
import { usePlayerStore } from '@/stores/playerStore'
import HeroSection from '@/components/sections/HeroSection.vue'
import SectionHeading from '@/components/ui/SectionHeading.vue'
import MatchCard from '@/components/ui/MatchCard.vue'
import SkeletonCard from '@/components/ui/SkeletonCard.vue'
import StateMessage from '@/components/ui/StateMessage.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import CountryFlag from '@/components/ui/CountryFlag.vue'

const game = useGameStore()
const stadiums = useStadiumStore()
const players = usePlayerStore()

const stadiumName = (id: number) => stadiums.stadiumById(id)?.name

const todayMatches = computed(() => game.todayMatches)
const upcoming = computed(() => game.upcomingMatches.slice(0, 4))
const live = computed(() => game.liveMatches)

async function load() {
  await Promise.all([game.fetchMatches(), stadiums.fetchStadiums(), players.fetchRanking('gols')])
}

onMounted(load)
</script>

<template>
  <div>
    <HeroSection :next-match="game.nextMatch" :has-live="live.length > 0" />

    <div class="container-app py-12">
      <!-- Erro global -->
      <StateMessage
        v-if="game.error && !game.loading"
        variant="erro"
        title="Não foi possível carregar os jogos"
        :message="game.error"
        retryable
        @retry="load"
      />

      <template v-else>
        <!-- AO VIVO -->
        <section v-if="live.length || game.loading" class="mb-12">
          <SectionHeading title="Ao vivo agora" subtitle="Acompanhe os jogos em tempo real" />
          <div class="grid gap-4 sm:grid-cols-2">
            <template v-if="game.loading">
              <SkeletonCard v-for="i in 2" :key="i" />
            </template>
            <MatchCard
              v-for="m in live"
              v-else
              :key="m.id"
              :match="m"
              :stadium-name="stadiumName(m.stadiumId)"
            />
          </div>
        </section>

        <!-- JOGOS DE HOJE -->
        <section class="mb-12">
          <SectionHeading title="Jogos de hoje">
            <template #action>
              <RouterLink to="/resultados">
                <BaseButton variant="ghost">Ver todos →</BaseButton>
              </RouterLink>
            </template>
          </SectionHeading>

          <div v-if="game.loading" class="grid gap-4 sm:grid-cols-2">
            <SkeletonCard v-for="i in 4" :key="i" />
          </div>
          <div v-else-if="todayMatches.length" class="grid gap-4 sm:grid-cols-2">
            <MatchCard
              v-for="m in todayMatches"
              :key="m.id"
              :match="m"
              :stadium-name="stadiumName(m.stadiumId)"
            />
          </div>
          <StateMessage
            v-else
            title="Nenhum jogo hoje"
            message="Confira a agenda completa na página de resultados."
          />
        </section>

        <!-- PRÓXIMOS JOGOS -->
        <section class="mb-12">
          <SectionHeading title="Próximos jogos" />
          <div v-if="game.loading" class="grid gap-4 sm:grid-cols-2">
            <SkeletonCard v-for="i in 4" :key="i" />
          </div>
          <div v-else class="grid gap-4 sm:grid-cols-2">
            <MatchCard
              v-for="m in upcoming"
              :key="m.id"
              :match="m"
              :stadium-name="stadiumName(m.stadiumId)"
            />
          </div>
        </section>

        <!-- DESTAQUE: ARTILHEIRO -->
        <section
          v-if="players.topScorer"
          class="overflow-hidden rounded-2xl bg-gradient-to-r from-darkblue to-secondary p-8 text-white"
        >
          <div class="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <span class="text-xs font-bold uppercase tracking-[0.2em] text-primary">Destaque do torneio</span>
              <h3 class="mt-2 font-heading text-3xl font-bold">Artilheiro</h3>
              <p class="mt-1 text-white/70">Quem mais balança as redes na Copa</p>
            </div>
            <div class="flex items-center gap-4 rounded-2xl bg-white/10 px-6 py-4 ring-1 ring-white/20">
              <CountryFlag :country-id="players.topScorer.countryId" size="xl" />
              <div>
                <div class="font-heading text-2xl font-bold">{{ players.topScorer.name }}</div>
                <div class="text-sm text-white/70">{{ players.topScorer.countryName }}</div>
              </div>
              <div class="border-l border-white/20 pl-4 text-center">
                <div class="font-heading text-4xl font-bold text-primary">{{ players.topScorer.value }}</div>
                <div class="text-xs uppercase tracking-wider text-white/60">gols</div>
              </div>
            </div>
          </div>
          <div class="mt-6 text-center sm:text-right">
            <RouterLink to="/estatisticas">
              <BaseButton variant="primary">Ver todas as estatísticas →</BaseButton>
            </RouterLink>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>
