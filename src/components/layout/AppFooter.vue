<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { DATA_SOURCE_LABEL } from '@/services/footballApi'
import logoCopa from '@/assets/logo/copa-2026-03.png'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-16 border-t border-black/5 bg-dark text-white/70">
    <div class="container-app grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <div class="mb-4 flex items-center gap-3">
          <span class="relative flex shrink-0 items-center justify-center">
            <!-- Halo radial que reforça o brilho natural da taça -->
            <span class="absolute h-14 w-14 rounded-full bg-primary/20 blur-2xl" aria-hidden="true"></span>
            <img
              :src="logoCopa"
              alt="Troféu da Copa do Mundo 2026"
              class="relative h-20 w-auto max-w-none object-contain drop-shadow-[0_3px_12px_rgba(250,204,21,0.4)]"
            />
          </span>
          <span class="font-heading text-xl font-bold tracking-wider text-white">
            COPA <span class="text-primary">2026</span>
          </span>
        </div>
        <p class="text-sm leading-relaxed">
          Resultados em tempo real, estatísticas e tudo sobre a Copa do Mundo de 2026 nos Estados
          Unidos, Canadá e México.
        </p>
      </div>

      <div>
        <h3 class="mb-3 text-sm font-bold uppercase tracking-wider text-white">Navegação</h3>
        <ul class="space-y-2 text-sm">
          <li><RouterLink to="/resultados" class="hover:text-primary">Resultados</RouterLink></li>
          <li><RouterLink to="/classificacao" class="hover:text-primary">Classificação</RouterLink></li>
          <li><RouterLink to="/estatisticas" class="hover:text-primary">Estatísticas</RouterLink></li>
        </ul>
      </div>

      <div>
        <h3 class="mb-3 text-sm font-bold uppercase tracking-wider text-white">Descubra</h3>
        <ul class="space-y-2 text-sm">
          <li><RouterLink to="/estadios" class="hover:text-primary">Estádios</RouterLink></li>
          <li><RouterLink to="/paises" class="hover:text-primary">Países</RouterLink></li>
        </ul>
      </div>

      <div>
        <h3 class="mb-3 text-sm font-bold uppercase tracking-wider text-white">Dados</h3>
        <p class="text-sm leading-relaxed">{{ DATA_SOURCE_LABEL }}</p>
      </div>
    </div>

    <div class="border-t border-white/10 py-4 text-center text-xs text-white/50">
      © {{ year }} Copa do Mundo 2026 · Feito para o fã de futebol ⚽
    </div>
  </footer>
</template>
