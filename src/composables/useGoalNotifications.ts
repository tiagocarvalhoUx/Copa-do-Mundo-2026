/**
 * useGoalNotifications — composable para ativar/desativar os alertas de gol. ⚽
 *
 * Encapsula o serviço de push (services/pushNotifications) com estado reativo
 * pronto para a UI: se é suportado, se está inscrito, carregando e erros.
 *
 * Uso típico em um componente:
 *   const { supported, subscribed, loading, error, toggle } = useGoalNotifications()
 *   <button @click="toggle">{{ subscribed ? 'Desativar' : 'Ativar' }} alertas de gol</button>
 */
import { onMounted, readonly, ref } from 'vue'
import {
  disableGoalAlerts,
  enableGoalAlerts,
  getActiveSubscription,
  getPermission,
  isPushSupported,
} from '@/services/pushNotifications'

export function useGoalNotifications() {
  const supported = ref(false)
  const subscribed = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  onMounted(async () => {
    supported.value = isPushSupported()
    if (!supported.value) return
    // Já estava inscrito numa visita anterior?
    subscribed.value = getPermission() === 'granted' && (await getActiveSubscription()) !== null
  })

  async function enable() {
    loading.value = true
    error.value = null
    try {
      await enableGoalAlerts()
      subscribed.value = true
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Falha ao ativar os alertas.'
    } finally {
      loading.value = false
    }
  }

  async function disable() {
    loading.value = true
    error.value = null
    try {
      await disableGoalAlerts()
      subscribed.value = false
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Falha ao desativar os alertas.'
    } finally {
      loading.value = false
    }
  }

  /** Alterna entre ativar e desativar conforme o estado atual. */
  async function toggle() {
    if (subscribed.value) await disable()
    else await enable()
  }

  return {
    supported: readonly(supported),
    subscribed: readonly(subscribed),
    loading: readonly(loading),
    error: readonly(error),
    enable,
    disable,
    toggle,
  }
}
