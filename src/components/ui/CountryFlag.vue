<script setup lang="ts">
import { computed } from 'vue'
import { countryById } from '@/data/countries'

/**
 * Exibe a bandeira de uma seleção como IMAGEM (flagcdn.com), garantindo
 * renderização uniforme em qualquer sistema — emojis de bandeira não aparecem
 * no Windows. Resolve o código da bandeira pelo id do país.
 */
const props = withDefaults(
  defineProps<{ countryId: number; size?: 'sm' | 'md' | 'lg' | 'xl' }>(),
  { size: 'md' },
)

const country = computed(() => countryById.get(props.countryId))

const box = computed(
  () =>
    ({
      sm: 'h-4 w-[1.5rem]',
      md: 'h-5 w-[1.85rem]',
      lg: 'h-8 w-[3rem]',
      xl: 'h-11 w-[4rem]',
    })[props.size],
)
</script>

<template>
  <img
    v-if="country"
    :src="`https://flagcdn.com/w80/${country.flagCode}.png`"
    :srcset="`https://flagcdn.com/w160/${country.flagCode}.png 2x`"
    :alt="`Bandeira: ${country.name}`"
    loading="lazy"
    width="80"
    height="60"
    :class="box"
    class="inline-block shrink-0 rounded-[3px] object-cover shadow-sm ring-1 ring-black/10"
  />
  <span v-else :class="box" class="inline-block shrink-0 rounded-[3px] bg-slate-200"></span>
</template>
