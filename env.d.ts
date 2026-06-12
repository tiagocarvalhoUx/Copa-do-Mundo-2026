/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Fonte de dados: 'mock' | 'thesportsdb' | 'apifootball'. */
  readonly VITE_DATA_PROVIDER: string
  // API-Football
  readonly VITE_FOOTBALL_API_KEY: string
  readonly VITE_FOOTBALL_API_URL: string
  readonly VITE_FOOTBALL_LEAGUE_ID: string
  readonly VITE_FOOTBALL_SEASON: string
  // TheSportsDB
  readonly VITE_TSDB_KEY: string
  readonly VITE_TSDB_LEAGUE: string
  readonly VITE_TSDB_SEASON: string
  /** (legado) Quando 'true', força dados mock. */
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
