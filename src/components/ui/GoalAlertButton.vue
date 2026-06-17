<script setup lang="ts">
/**
 * GoalAlertButton — botão para o usuário ativar/desativar as notificações de
 * gol em tempo real. ⚽ Use em qualquer página (ex.: Home, detalhes do jogo).
 *
 *   <GoalAlertButton />
 */
import { useGoalNotifications } from '@/composables/useGoalNotifications'
import BaseButton from '@/components/ui/BaseButton.vue'

const { supported, subscribed, loading, error, toggle } = useGoalNotifications()
</script>

<template>
  <div v-if="supported" class="flex flex-col items-start gap-1">
    <BaseButton
      :variant="subscribed ? 'secondary' : 'primary'"
      :disabled="loading"
      @click="toggle"
    >
      <span aria-hidden="true">⚽</span>
      <span>
        {{
          loading
            ? 'Aguarde…'
            : subscribed
              ? 'Alertas de gol ativados'
              : 'Avise-me dos gols'
        }}
      </span>
    </BaseButton>

    <p v-if="error" class="text-sm text-red-400" role="alert">{{ error }}</p>
  </div>
</template>
