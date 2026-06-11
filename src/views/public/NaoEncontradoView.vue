<script setup lang="ts">
import { RouterLink } from 'vue-router'
import BaseButton from '@/components/ui/BaseButton.vue'
</script>

<template>
  <div class="container-app flex min-h-[60vh] flex-col items-center justify-center text-center">
    <span class="text-7xl">🥅</span>
    <h1 class="mt-4 font-heading text-4xl font-bold text-dark">Bola pra fora!</h1>
    <p class="mt-2 max-w-sm text-slate-500">
      A página que você procurou não foi encontrada. Que tal voltar para o campo principal?
    </p>
    <RouterLink to="/" class="mt-6">
      <BaseButton>Voltar para o início</BaseButton>
    </RouterLink>
  </div>
</template>
