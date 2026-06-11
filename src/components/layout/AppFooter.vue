<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { USE_MOCK } from '@/services/footballApi'
import logoCopa from '@/assets/logo/logo-otimizado.png'

const year = new Date().getFullYear()
</script>

<template>
  <footer class="mt-16 border-t border-black/5 bg-dark text-white/70">
    <div class="container-app grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <div class="mb-3 flex items-center gap-2">
          <span class="flex h-11 items-center justify-center rounded-lg bg-gradient-to-b from-secondary-dark to-black px-1.5 ring-1 ring-primary/50">
            <img :src="logoCopa" alt="Troféu da Copa do Mundo 2026" class="h-full w-auto max-w-none object-contain py-1" />
          </span>
          <span class="font-heading text-base font-bold tracking-wider text-white">COPA 2026</span>
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
        <p class="text-sm leading-relaxed">
          {{
            USE_MOCK
              ? 'Exibindo dados de demonstração. Conecte uma chave de API para dados ao vivo.'
              : 'Conectado à API de futebol em tempo real.'
          }}
        </p>
      </div>
    </div>

    <div class="border-t border-white/10 py-4 text-center text-xs text-white/50">
      © {{ year }} Copa do Mundo 2026 · Feito para o fã de futebol ⚽
    </div>
  </footer>
</template>
