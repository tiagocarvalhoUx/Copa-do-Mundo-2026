<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{ online: boolean }>()

// Mostra "reconectado" brevemente quando volta a ficar online.
const showReconnected = ref(false)
watch(
  () => props.online,
  (isOnline, wasOnline) => {
    if (isOnline && wasOnline === false) {
      showReconnected.value = true
      window.setTimeout(() => (showReconnected.value = false), 3000)
    }
  },
)
</script>

<template>
  <Transition name="page">
    <div
      v-if="!online"
      class="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit items-center gap-2 rounded-full bg-danger px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
      role="alert"
    >
      <span class="h-2 w-2 animate-pulse-live rounded-full bg-white"></span>
      Sem conexão — tentando reconectar…
    </div>
    <div
      v-else-if="showReconnected"
      class="fixed inset-x-0 bottom-4 z-50 mx-auto flex w-fit items-center gap-2 rounded-full bg-accent-dark px-4 py-2.5 text-sm font-semibold text-white shadow-lg"
      role="status"
    >
      ✅ Conexão restabelecida
    </div>
  </Transition>
</template>
