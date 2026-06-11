<script setup lang="ts">
import { computed } from 'vue'

type Variant = 'primary' | 'secondary' | 'ghost'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    type?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  { variant: 'primary', type: 'button', disabled: false },
)

const cls = computed(() => {
  switch (props.variant) {
    case 'secondary':
      return 'btn-secondary'
    case 'ghost':
      return 'btn-ghost'
    default:
      return 'btn-primary'
  }
})
</script>

<template>
  <button :type="type" :class="cls" :disabled="disabled">
    <slot />
  </button>
</template>
