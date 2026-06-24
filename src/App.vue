<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import AppNavbar from '@/components/layout/AppNavbar.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import ConnectionToast from '@/components/ui/ConnectionToast.vue'
import DonationPopup from '@/components/ui/DonationPopup.vue'
import { Analytics } from '@vercel/analytics/vue'

// Acessibilidade: link "pular para o conteúdo"
const online = ref(navigator.onLine)
function updateOnline() {
  online.value = navigator.onLine
}
onMounted(() => {
  window.addEventListener('online', updateOnline)
  window.addEventListener('offline', updateOnline)
})
onUnmounted(() => {
  window.removeEventListener('online', updateOnline)
  window.removeEventListener('offline', updateOnline)
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-light">
    <a
      href="#conteudo"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-secondary focus:px-4 focus:py-2 focus:text-white"
    >
      Pular para o conteúdo
    </a>

    <AppNavbar />

    <main id="conteudo" class="flex-1">
      <RouterView v-slot="{ Component }">
        <Transition name="page" mode="out-in">
          <component :is="Component" />
        </Transition>
      </RouterView>
    </main>

    <AppFooter />

    <ConnectionToast :online="online" />

    <DonationPopup />

    <Analytics />
  </div>
</template>
