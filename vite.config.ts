import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      host: true,
      // Proxy de desenvolvimento: a football-data.org não envia cabeçalhos CORS,
      // então o navegador não pode chamá-la direto. Encaminhamos por aqui e
      // injetamos a chave (X-Auth-Token) no servidor de dev.
      proxy: {
        '/api/footballdata': {
          target: 'https://api.football-data.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/footballdata/, ''),
          headers: env.VITE_FOOTBALLDATA_KEY
            ? { 'X-Auth-Token': env.VITE_FOOTBALLDATA_KEY }
            : undefined,
        },
      },
    },
  }
})
