/**
 * Magic-link / member session token utilities.
 * Uses jose (same library NextAuth uses internally) to sign JWTs
 * with NEXTAUTH_SECRET so one secret covers both auth paths.
 */
import { SignJWT, jwtVerify } from 'jose'
import { randomBytes } from 'crypto'

function getSecret() {
  return new TextEncoder().encode(process.env.NEXTAUTH_SECRET!)
}

/** Create a signed JWT to set as the member_session cookie */
export async function createMemberSessionJWT(memberId: string): Promise<string> {
  return new SignJWT({ memberId, role: 'MEMBER' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

/** Verify and decode a member_session JWT. Returns null if invalid/expired. */
export async function verifyMemberSessionJWT(
  token: string
): Promise<{ memberId: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as { memberId: string; role: string }
  } catch {
    return null
  }
}

/** Generate a cryptographically random opaque token for magic links */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('hex')
}
