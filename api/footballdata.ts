/**
 * Serverless Function (Node.js) — proxy da football-data.org para a Vercel.
 *
 * Por que existe: a football-data.org NÃO envia cabeçalhos CORS, então o
 * navegador não pode chamá-la direto. Esta função, rodando no mesmo domínio do
 * site (same-origin), encaminha a requisição e injeta a chave `X-Auth-Token`
 * NO SERVIDOR — assim a chave nunca vai para o bundle do cliente.
 *
 * Roteamento: o catch-all por nome de arquivo (`[...path].ts`) não era publicado
 * pela Vercel, então usamos UMA função + um rewrite no vercel.json:
 *   /api/footballdata/v4/competitions/WC/matches
 *     → (rewrite) → /api/footballdata?path=v4/competitions/WC/matches
 * e aqui reconstruímos a URL real da football-data.org.
 *
 * Config na Vercel (Settings → Environment Variables):
 *   FOOTBALLDATA_KEY   — sua chave (SEM o prefixo VITE_ → fica só no servidor)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node'

const API_BASE = 'https://api.football-data.org'

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

  // O caminho real chega no parâmetro `path` (via rewrite do vercel.json).
  const rawPath = req.query.path
  const path = Array.isArray(rawPath) ? rawPath.join('/') : (rawPath ?? '')

  // Repassa os demais parâmetros de query (ex.: ?limit=20), exceto o `path`.
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries(req.query)) {
    if (k === 'path' || v == null) continue
    if (Array.isArray(v)) v.forEach((val) => params.append(k, val))
    else params.append(k, v)
  }
  const qs = params.toString()
  const target = `${API_BASE}/${path}${qs ? `?${qs}` : ''}`

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
  // Cache na borda da Vercel: poupa o limite de requisições da API (10 req/min no free).
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300')
  res.status(upstream.status).send(body)
}
