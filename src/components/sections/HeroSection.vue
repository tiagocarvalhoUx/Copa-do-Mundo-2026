<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Match } from '@/types'
import { useCountdown } from '@/composables/useCountdown'
import { useFormatters } from '@/composables/useFormatters'
import BaseButton from '@/components/ui/BaseButton.vue'
import CountryFlag from '@/components/ui/CountryFlag.vue'

const props = defineProps<{ nextMatch?: Match; hasLive: boolean }>()
const { formatFull } = useFormatters()

const { days, hours, minutes, seconds, finished } = useCountdown(() => props.nextMatch?.date)

const blocks = computed(() => [
  { label: 'Dias', value: days.value },
  { label: 'Horas', value: hours.value },
  { label: 'Min', value: minutes.value },
  { label: 'Seg', value: seconds.value },
])
</script>

<template>
  <section class="relative overflow-hidden bg-secondary-dark text-white">
    <!-- Fundo: foto aérea de estádio -->
    <img
      src="https://images.unsplash.com/photo-1459865264687-595d652de67e?auto=format&fit=crop&w=1600&q=70"
      alt=""
      aria-hidden="true"
      fetchpriority="high"
      class="absolute inset-0 h-full w-full object-cover"
    />
    <!-- Overlays: tinta azul-marinho CBF (foto visível no centro) + escurecimento à esquerda p/ legibilidade -->
    <div class="absolute inset-0 bg-gradient-to-br from-secondary-dark/85 via-secondary/45 to-secondary-dark/80"></div>
    <div class="absolute inset-0 bg-gradient-to-r from-darkblue/90 via-darkblue/20 to-transparent"></div>
    <!-- Brilho amarelo sutil (pop CBF) -->
    <div class="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl"></div>

    <div class="container-app relative py-16 sm:py-20 lg:py-24">
      <div class="grid items-center gap-10 lg:grid-cols-2">
        <!-- Texto -->
        <div class="animate-fade-in">
          <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary ring-1 ring-white/20">
            ⚽ EUA · Canadá · México
          </span>
          <h1 class="mt-4 font-heading text-4xl font-bold uppercase leading-none tracking-wide sm:text-5xl lg:text-6xl">
            Copa do Mundo
            <span class="block text-primary">2026</span>
          </h1>
          <p class="mt-4 max-w-md text-base text-white/80 sm:text-lg">
            Acompanhe cada lance em tempo real: placares, gols, cartões, escalações e as
            estatísticas que só o maior torneio do planeta tem.
          </p>

          <div class="mt-7 flex flex-wrap gap-3">
            <RouterLink to="/resultados">
              <BaseButton variant="primary">Ver jogos</BaseButton>
            </RouterLink>
            <RouterLink v-if="hasLive" to="/resultados">
              <BaseButton variant="ghost">
                <span class="flex items-center gap-2 text-white">
                  <span class="h-2 w-2 animate-pulse-live rounded-full bg-primary"></span>
                  Jogo ao vivo agora
                </span>
              </BaseButton>
            </RouterLink>
          </div>
        </div>

        <!-- Contagem regressiva -->
        <div class="animate-fade-in">
          <div class="rounded-2xl bg-white/10 p-6 shadow-xl ring-1 ring-white/20 backdrop-blur">
            <p class="text-center text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {{ finished ? 'A bola está rolando!' : 'Próximo jogo começa em' }}
            </p>

            <div v-if="!finished" class="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
              <div
                v-for="b in blocks"
                :key="b.label"
                class="rounded-xl bg-dark/40 py-3 text-center ring-1 ring-white/10"
              >
                <div class="font-heading text-3xl font-bold tabular-nums sm:text-4xl">
                  {{ String(b.value).padStart(2, '0') }}
                </div>
                <div class="text-[10px] font-semibold uppercase tracking-wider text-white/60">
                  {{ b.label }}
                </div>
              </div>
            </div>

            <div v-else class="mt-4 py-6 text-center">
              <span class="text-5xl">🏆</span>
            </div>

            <RouterLink
              v-if="nextMatch"
              :to="`/jogo/${nextMatch.id}`"
              class="mt-5 flex items-center justify-center gap-3 rounded-xl bg-white/5 px-4 py-3 transition-colors hover:bg-white/10"
            >
              <CountryFlag :country-id="nextMatch.home.countryId" size="md" />
              <span class="font-heading text-sm font-semibold">{{ nextMatch.home.name }}</span>
              <span class="text-xs text-white/50">vs</span>
              <span class="font-heading text-sm font-semibold">{{ nextMatch.away.name }}</span>
              <CountryFlag :country-id="nextMatch.away.countryId" size="md" />
            </RouterLink>
            <p v-if="nextMatch" class="mt-2 text-center text-xs text-white/50">
              {{ formatFull(nextMatch.date) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
