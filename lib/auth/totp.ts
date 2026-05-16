import crypto from 'crypto'

/**
 * RFC 6238 TOTP implementation using Node.js crypto.
 * No external dependencies — works reliably in all Next.js contexts.
 */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function base32Decode(encoded: string): Buffer {
  let bits = ''
  for (const char of encoded.toUpperCase().replace(/[=\s]/g, '')) {
    const val = BASE32_ALPHABET.indexOf(char)
    if (val === -1) continue
    bits += val.toString(2).padStart(5, '0')
  }
  const bytes: number[] = []
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.substring(i, i + 8), 2))
  }
  return Buffer.from(bytes)
}

function generateCode(secret: string, counter: number): string {
  const key = base32Decode(secret)
  const counterBuf = Buffer.alloc(8)
  counterBuf.writeUInt32BE(Math.floor(counter / 0x100000000), 0)
  counterBuf.writeUInt32BE(counter >>> 0, 4)

  const hmac = crypto.createHmac('sha1', key).update(counterBuf).digest()
  const offset = hmac[hmac.length - 1] & 0x0f
  const code =
    (((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)) %
    1_000_000

  return code.toString().padStart(6, '0')
}

/**
 * Verify a TOTP token against a base32-encoded secret.
 * Allows ±`window` time steps (each step = 30 seconds).
 */
export function verifyTOTP(token: string, secret: string, window = 1): boolean {
  const counter = Math.floor(Date.now() / 1000 / 30)
  for (let i = -window; i <= window; i++) {
    if (generateCode(secret, counter + i) === token) {
      return true
    }
  }
  return false
}

