/**
 * Serverless (Edge) Function — proxy da football-data.org para a Vercel.
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
export const config = { runtime: 'edge' }

const API_BASE = 'https://api.football-data.org'
const PREFIX = '/api/footballdata'

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return json({ error: 'Método não permitido.' }, 405)
  }

  const key = process.env.FOOTBALLDATA_KEY
  if (!key) {
    return json({ error: 'FOOTBALLDATA_KEY não configurada no servidor.' }, 500)
  }

  const url = new URL(req.url)
  const path = url.pathname.startsWith(PREFIX)
    ? url.pathname.slice(PREFIX.length)
    : url.pathname
  const target = `${API_BASE}${path}${url.search}`

  let upstream: Response
  try {
    upstream = await fetch(target, {
      headers: { 'X-Auth-Token': key, Accept: 'application/json' },
    })
  } catch {
    return json({ error: 'Falha ao contatar a football-data.org.' }, 502)
  }

  const body = await upstream.text()
  return new Response(body, {
    status: upstream.status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      // Cache na borda da Vercel: poupa o limite de requisições da API
      // (10 req/min no plano grátis) servindo respostas repetidas do edge.
      'Cache-Control': 's-maxage=30, stale-while-revalidate=300',
    },
  })
}
