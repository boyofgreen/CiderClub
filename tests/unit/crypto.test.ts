import { describe, it, expect } from 'vitest'
import { encryptSecret, decryptSecret } from '@/lib/crypto'

describe('secret encryption', () => {
  it('round-trips values', () => {
    const stored = encryptSecret('EAAAl-super-secret-square-token')
    expect(stored).toMatch(/^v1\./)
    expect(stored).not.toContain('super-secret')
    expect(decryptSecret(stored)).toBe('EAAAl-super-secret-square-token')
  })

  it('produces a different ciphertext each time (random IV)', () => {
    expect(encryptSecret('same')).not.toBe(encryptSecret('same'))
  })

  it('rejects tampered ciphertext', () => {
    const stored = encryptSecret('token')
    const parts = stored.split('.')
    // Flip a character in the ciphertext
    const tampered = [...parts.slice(0, 3), parts[3].slice(0, -2) + 'AA'].join('.')
    expect(() => decryptSecret(tampered)).toThrow()
  })

  it('rejects unknown formats', () => {
    expect(() => decryptSecret('plaintext-token')).toThrow(/format/)
  })
})
