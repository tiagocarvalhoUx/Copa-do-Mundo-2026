<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import logoCopa from '@/assets/logo/logo-otimizado.png'

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
    <nav class="container-app flex h-16 items-center justify-between" aria-label="Navegação principal">
      <!-- Logo -->
      <RouterLink to="/" class="flex items-center gap-2.5" @click="mobileOpen = false">
        <span
          class="flex h-12 items-center justify-center rounded-xl bg-gradient-to-b from-secondary-dark to-darkblue px-2 shadow-sm ring-1 ring-primary/50"
        >
          <img
            :src="logoCopa"
            alt="Troféu da Copa do Mundo 2026"
            class="h-full w-auto max-w-none object-contain py-1.5"
          />
        </span>
        <span class="flex flex-col leading-none">
          <span class="font-heading text-lg font-bold tracking-wider">COPA 2026</span>
          <span class="text-[10px] font-medium uppercase tracking-[0.2em] text-primary">Tempo Real</span>
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
