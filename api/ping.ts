import type { VercelRequest, VercelResponse } from '@vercel/node'

// Função de diagnóstico: confirma se a Vercel está publicando funções de /api.
export default function handler(_req: VercelRequest, res: VercelResponse): void {
  res.status(200).json({ ok: true, time: new Date().toISOString() })
}
