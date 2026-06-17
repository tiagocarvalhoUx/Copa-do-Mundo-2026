<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import logoCopa from '@/assets/logo/copa-2026-03.png'

const links = [
  { to: '/', label: 'Início' },
  { to: '/resultados', label: 'Resultados' },
  { to: '/classificacao', label: 'Classificação' },
  { to: '/estatisticas', label: 'Estatísticas' },
  { to: '/estadios', label: 'Estádios' },
  { to: '/paises', label: 'Países' },
]

const mobileOpen = ref(false)
</script>

<template>
  <header class="sticky top-0 z-40 border-b border-white/10 bg-secondary text-white shadow-lg">
    <nav class="container-app flex h-20 items-center justify-between" aria-label="Navegação principal">
      <!-- Logo -->
      <RouterLink to="/" class="group flex items-center gap-3" @click="mobileOpen = false">
        <span class="relative flex shrink-0 items-center justify-center">
          <!-- Halo radial que reforça o brilho natural da taça -->
          <span
            class="absolute h-16 w-16 rounded-full bg-primary/25 blur-2xl transition-all duration-300 group-hover:bg-primary/40"
            aria-hidden="true"
          ></span>
          <img
            :src="logoCopa"
            alt="Troféu da Copa do Mundo 2026"
            class="relative h-[72px] w-auto max-w-none object-contain drop-shadow-[0_3px_12px_rgba(250,204,21,0.45)] transition-transform duration-300 will-change-transform group-hover:scale-110"
          />
        </span>
        <span class="flex flex-col leading-none">
          <span class="font-heading text-xl font-bold tracking-wider sm:text-2xl">
            COPA <span class="text-primary">2026</span>
          </span>
          <span class="text-[11px] font-semibold uppercase tracking-[0.25em] text-primary/90">Tempo Real</span>
        </span>
      </RouterLink>

      <!-- Links desktop -->
      <ul class="hidden items-center gap-1 md:flex">
        <li v-for="link in links" :key="link.to">
          <RouterLink
            :to="link.to"
            class="rounded-lg px-3 py-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            active-class="!text-primary"
          >
            {{ link.label }}
          </RouterLink>
        </li>
      </ul>

      <!-- Botão mobile -->
      <button
        class="grid h-10 w-10 place-items-center rounded-lg hover:bg-white/10 md:hidden"
        :aria-expanded="mobileOpen"
        aria-label="Abrir menu"
        @click="mobileOpen = !mobileOpen"
      >
        <svg v-if="!mobileOpen" class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        <svg v-else class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </nav>

    <!-- Menu mobile -->
    <Transition name="page">
      <ul v-if="mobileOpen" class="border-t border-white/10 bg-secondary-dark px-4 pb-4 pt-2 md:hidden">
        <li v-for="link in links" :key="link.to">
          <RouterLink
            :to="link.to"
            class="block rounded-lg px-3 py-3 font-semibold text-white/90 transition-colors hover:bg-white/10"
            active-class="!text-primary"
            @click="mobileOpen = false"
          >
            {{ link.label }}
          </RouterLink>
        </li>
      </ul>
    </Transition>
  </header>
</template>
