// Monta o payload Pix "Copia e Cola" (BR Code / EMV) para QR Code estático.
// O nome e a cidade são apenas exibidos no app do banco; o pagamento vai pela chave.

interface PixParams {
  key: string
  merchantName: string
  merchantCity: string
  txid?: string
}

// Formata um campo EMV: ID + tamanho (2 dígitos) + valor.
function field(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${id}${len}${value}`
}

// CRC16-CCITT (polinômio 0x1021, inicial 0xFFFF) — exigido pelo padrão Pix.
function crc16(payload: string): string {
  let crc = 0xffff
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1
      crc &= 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// Remove acentos e caracteres não suportados pelo padrão.
function sanitize(value: string, max: number): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9 ]/g, '')
    .toUpperCase()
    .slice(0, max)
}

export function buildPixPayload({ key, merchantName, merchantCity, txid = '***' }: PixParams): string {
  const merchantAccount = field('26', field('00', 'br.gov.bcb.pix') + field('01', key))
  const additionalData = field('62', field('05', txid))

  const payload =
    field('00', '01') + // Payload Format Indicator
    merchantAccount +
    field('52', '0000') + // Merchant Category Code
    field('53', '986') + // Moeda: BRL
    field('58', 'BR') + // País
    field('59', sanitize(merchantName, 25)) +
    field('60', sanitize(merchantCity, 15)) +
    additionalData +
    '6304' // ID + tamanho do CRC; o valor é calculado sobre tudo isso

  return payload + crc16(payload)
}
