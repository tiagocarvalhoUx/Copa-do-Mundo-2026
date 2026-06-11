<script setup lang="ts">
import type { MatchStatus } from '@/types'
import { useFormatters } from '@/composables/useFormatters'

const props = defineProps<{ status: MatchStatus; minute?: number }>()
const { statusLabel } = useFormatters()
</script>

<template>
  <span
    v-if="props.status === 'ao-vivo' || props.status === 'intervalo'"
    class="badge-live"
    role="status"
  >
    <span class="h-2 w-2 animate-pulse-live rounded-full bg-danger"></span>
    {{ props.status === 'intervalo' ? 'Intervalo' : 'Ao vivo' }}
    <span v-if="props.status === 'ao-vivo' && props.minute" class="tabular-nums">· {{ props.minute }}'</span>
  </span>

  <span
    v-else-if="props.status === 'encerrado'"
    class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-500"
  >
    Encerrado
  </span>

  <span
    v-else
    class="inline-flex items-center rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-secondary"
  >
    {{ statusLabel(props.status, props.minute) }}
  </span>
</template>
