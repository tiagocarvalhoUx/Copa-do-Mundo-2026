import { computed, onUnmounted, ref, type Ref } from 'vue'

export interface Countdown {
  days: Ref<number>
  hours: Ref<number>
  minutes: Ref<number>
  seconds: Ref<number>
  /** true quando a data-alvo já passou. */
  finished: Ref<boolean>
}

/**
 * Contagem regressiva reativa até uma data-alvo (ISO string ou Date).
 * Atualiza a cada segundo e limpa o intervalo ao desmontar.
 */
export function useCountdown(target: () => string | Date | undefined): Countdown {
  const days = ref(0)
  const hours = ref(0)
  const minutes = ref(0)
  const seconds = ref(0)
  const finished = ref(false)

  function tick() {
    const t = target()
    if (!t) {
      finished.value = true
      return
    }
    const diff = +new Date(t) - Date.now()
    if (diff <= 0) {
      days.value = hours.value = minutes.value = seconds.value = 0
      finished.value = true
      return
    }
    finished.value = false
    days.value = Math.floor(diff / 86_400_000)
    hours.value = Math.floor((diff % 86_400_000) / 3_600_000)
    minutes.value = Math.floor((diff % 3_600_000) / 60_000)
    seconds.value = Math.floor((diff % 60_000) / 1000)
  }

  tick()
  const timer = window.setInterval(tick, 1000)
  onUnmounted(() => window.clearInterval(timer))

  return { days, hours, minutes, seconds, finished }
}

/** Versão útil para exibir o alvo formatado em conjunto. */
export function useCountdownLabel(target: () => string | Date | undefined) {
  const cd = useCountdown(target)
  const label = computed(
    () =>
      `${String(cd.days.value).padStart(2, '0')}d ${String(cd.hours.value).padStart(2, '0')}h ${String(
        cd.minutes.value,
      ).padStart(2, '0')}m`,
  )
  return { ...cd, label }
}
