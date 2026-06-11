/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FOOTBALL_API_KEY: string
  readonly VITE_FOOTBALL_API_URL: string
  /** Id da competição (Copa do Mundo) na API-Football. */
  readonly VITE_FOOTBALL_LEAGUE_ID: string
  /** Temporada (ex.: 2026). */
  readonly VITE_FOOTBALL_SEASON: string
  /** Quando 'true', usa dados mock locais em vez de chamar a API real. */
  readonly VITE_USE_MOCK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
