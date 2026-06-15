/**
 * Serverless Function (Node.js) — proxy da football-data.org para a Vercel.
 *
 * Por que existe: a football-data.org NÃO envia cabeçalhos CORS, então o
 * navegador não pode chamá-la direto. Esta função, rodando no mesmo domínio do
 * site (same-origin), encaminha a requisição e injeta a chave `X-Auth-Token`
 * NO SERVIDOR — assim a chave nunca vai para o bundle do cliente.
 *
 * Rota: qualquer GET em /api/footballdata/<resto> é repassado para
 *       https://api.football-data.org/<resto> (preservando a query string).
 *       Ex.: /api/footballdata/v4/competitions/WC/matches
 *
 * Config na Vercel (Settings → Environment Variables):
 *   FOOTBALLDATA_KEY   — sua chave (SEM o prefixo VITE_ → fica só no servidor)
 *   VITE_DATA_PROVIDER = footballdata
 *   (VITE_FOOTBALLDATA_URL já tem o padrão /api/footballdata/v4)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

const API_BASE = 'https://api.football-data.org'
const PREFIX = '/api/footballdata'

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ error: 'Método não permitido.' })
    return
  }

  const key = process.env.FOOTBALLDATA_KEY
  if (!key) {
    res.status(500).json({ error: 'FOOTBALLDATA_KEY não configurada no servidor.' })
    return
  }

  // req.url já vem como caminho + query string (ex.: /api/footballdata/v4/...?limit=20)
  const reqUrl = req.url ?? ''
  const path = reqUrl.startsWith(PREFIX) ? reqUrl.slice(PREFIX.length) : reqUrl
  const target = `${API_BASE}${path}`

  let upstream: Response
  try {
    upstream = await fetch(target, {
      headers: { 'X-Auth-Token': key, Accept: 'application/json' },
    })
  } catch {
    res.status(502).json({ error: 'Falha ao contatar a football-data.org.' })
    return
  }

  const body = await upstream.text()
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  // Cache na borda da Vercel: poupa o limite de requisições da API
  // (10 req/min no plano grátis) servindo respostas repetidas do edge.
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300')
  res.status(upstream.status).send(body)
}
