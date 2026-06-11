<script setup lang="ts">
/** Estado de erro ou vazio com mensagem amigável e ação opcional de retry. */
withDefaults(
  defineProps<{
    variant?: 'erro' | 'vazio'
    title: string
    message?: string
    retryable?: boolean
  }>(),
  { variant: 'vazio', retryable: false },
)

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div class="flex flex-col items-center justify-center rounded-2xl bg-white px-6 py-14 text-center ring-1 ring-black/5">
    <div
      class="mb-4 grid h-16 w-16 place-items-center rounded-full text-3xl"
      :class="variant === 'erro' ? 'bg-danger/10' : 'bg-secondary/10'"
    >
      {{ variant === 'erro' ? '⚠️' : '🔍' }}
    </div>
    <h3 class="font-heading text-lg font-bold text-dark">{{ title }}</h3>
    <p v-if="message" class="mt-1 max-w-md text-sm text-slate-500">{{ message }}</p>
    <button
      v-if="retryable"
      class="btn-primary mt-5"
      @click="emit('retry')"
    >
      Tentar novamente
    </button>
  </div>
</template>
