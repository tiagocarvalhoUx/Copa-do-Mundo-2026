<script setup lang="ts">
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <div class="mb-6 flex items-end justify-between gap-4">
    <div>
      <div class="mb-1 h-1 w-12 rounded-full bg-primary"></div>
      <h2 class="font-heading text-2xl font-bold uppercase tracking-wide text-dark sm:text-3xl">
        {{ title }}
      </h2>
      <p v-if="subtitle" class="mt-1 text-sm text-slate-500">{{ subtitle }}</p>
    </div>
    <slot name="action" />
  </div>
</template>
