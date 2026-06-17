/**
 * Cliente Supabase para as funções serverless (lado do servidor). 🗄️
 *
 * Usa a SERVICE ROLE KEY — ela ignora o RLS, então só pode existir no servidor
 * (variável SEM prefixo VITE_). Nunca exponha essa chave no cliente.
 *
 * Variáveis de ambiente (Vercel → Settings → Environment Variables):
 *   SUPABASE_URL                = https://xzfpvmquhunxipbllicu.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY   = (Supabase → Project Settings → API → service_role)
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (client) return client

  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configuradas no servidor.')
  }

  client = createClient(url, key, { auth: { persistSession: false } })
  return client
}

// Nomes das tabelas (isoladas com prefixo copa_ no schema public).
export const TBL_SUBSCRIPTIONS = 'copa_push_subscriptions'
export const TBL_SCORES = 'copa_match_scores'
