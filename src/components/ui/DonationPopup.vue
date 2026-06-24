<script setup lang="ts">
import { onMounted, ref } from 'vue'
import QRCode from 'qrcode'
import { buildPixPayload } from '@/composables/usePixPayload'

const PIX_KEY = '32067274805'

// Nome e cidade são só exibidos no app do banco — o pagamento vai pela chave.
const pixPayload = buildPixPayload({
  key: PIX_KEY,
  merchantName: 'Tiago Boatto Carvalho',
  merchantCity: 'Aracatuba SP',
})

const visible = ref(false)
const copied = ref(false)
const qrDataUrl = ref('')

onMounted(async () => {
  // Aparece toda vez que alguém abre o app
  visible.value = true
  // Gera o QR Code Pix (BR Code) como imagem
  qrDataUrl.value = await QRCode.toDataURL(pixPayload, {
    margin: 1,
    width: 220,
    color: { dark: '#0b2472', light: '#ffffff' },
  })
})

function close() {
  visible.value = false
}

async function copyPix() {
  try {
    await navigator.clipboard.writeText(PIX_KEY)
    copied.value = true
    window.setTimeout(() => (copied.value = false), 2500)
  } catch {
    // Fallback para navegadores sem Clipboard API
    const el = document.createElement('textarea')
    el.value = PIX_KEY
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copied.value = true
    window.setTimeout(() => (copied.value = false), 2500)
  }
}
</script>

<template>
  <Transition name="page">
    <div
      v-if="visible"
      class="fixed inset-0 z-[100] flex items-center justify-center bg-darkblue/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="doacao-titulo"
      @click.self="close"
    >
      <div
        class="relative w-full max-w-md animate-fade-in overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <!-- Faixa superior -->
        <div class="bg-secondary px-6 py-4 text-center">
          <h2 id="doacao-titulo" class="font-heading text-xl font-bold text-white">
            🏆 E aí, vai deixar o Bozo na seca?
          </h2>
        </div>

        <button
          type="button"
          class="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-white/90 transition hover:bg-white/20"
          aria-label="Fechar"
          @click="close"
        >
          <span class="text-xl leading-none">&times;</span>
        </button>

        <!-- Conteúdo -->
        <div class="space-y-4 px-6 py-5 text-center text-dark">
          <p class="text-sm leading-relaxed">
            Brincadeira... mas se esse app já te salvou de perder um gol, que tal ajudar o dev?
            O preço de um cafézinho, uns <strong>R$ 5 a R$ 10</strong>, já ajuda demais a manter
            tudo rodando liso! ⚽
          </p>

          <div class="rounded-xl border border-dashed border-secondary/40 bg-light p-3">
            <p class="mb-2 text-xs font-semibold uppercase tracking-wide text-secondary">
              Escaneie o QR Code Pix
            </p>

            <div class="mb-3 flex justify-center">
              <img
                v-if="qrDataUrl"
                :src="qrDataUrl"
                alt="QR Code Pix para doação"
                class="h-44 w-44 rounded-lg bg-white p-1 shadow-sm"
              />
              <div v-else class="flex h-44 w-44 items-center justify-center text-xs text-dark/50">
                Gerando QR Code…
              </div>
            </div>

            <p class="mb-1 text-xs font-medium text-dark/70">ou copie a chave</p>
            <div class="flex items-center justify-center gap-2">
              <code class="select-all font-mono text-base font-bold text-darkblue">
                {{ PIX_KEY }}
              </code>
              <button
                type="button"
                class="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-darkblue transition hover:bg-primary-dark"
                @click="copyPix"
              >
                {{ copied ? '✅ Copiado!' : 'Copiar' }}
              </button>
            </div>
          </div>

          <p class="text-sm font-semibold text-accent-dark">
            Obrigado e <span class="text-secondary">#VaiBrasil</span> 🇧🇷
          </p>

          <button
            type="button"
            class="w-full rounded-xl bg-secondary py-2.5 text-sm font-bold text-white transition hover:bg-secondary-dark"
            @click="close"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>
