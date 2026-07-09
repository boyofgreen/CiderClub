/**
 * Symmetric encryption for secrets at rest (Square OAuth tokens, etc.).
 * AES-256-GCM with a random IV per value; format: v1.<iv>.<authTag>.<ciphertext>
 * (all base64). The key comes from APP_ENCRYPTION_KEY — 32 bytes, base64:
 *
 *   node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
 *
 * Rotating the key requires re-encrypting stored values (or a v2 prefix with
 * dual-key decryption during the transition).
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

function getKey(): Buffer {
  const raw = process.env.APP_ENCRYPTION_KEY
  if (!raw) {
    throw new Error(
      'APP_ENCRYPTION_KEY is not set — required to encrypt/decrypt stored secrets.'
    )
  }
  const key = Buffer.from(raw, 'base64')
  if (key.length !== 32) {
    throw new Error('APP_ENCRYPTION_KEY must be 32 bytes, base64-encoded.')
  }
  return key
}

export function encryptSecret(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `v1.${iv.toString('base64')}.${tag.toString('base64')}.${ciphertext.toString('base64')}`
}

export function decryptSecret(stored: string): string {
  const [version, ivB64, tagB64, ctB64] = stored.split('.')
  if (version !== 'v1' || !ivB64 || !tagB64 || !ctB64) {
    throw new Error('Unrecognized encrypted-secret format.')
  }
  const key = getKey()
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(ctB64, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}
