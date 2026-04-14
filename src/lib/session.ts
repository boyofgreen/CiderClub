/**
 * Unified session helper for server components and API routes.
 * Supports both NextAuth OAuth sessions and magic-link cookie sessions.
 */
import { getServerSession } from 'next-auth'
import { cookies } from 'next/headers'
import { authOptions } from '@/lib/auth'
import { verifyMemberSessionJWT } from '@/lib/tokens'
import { prisma } from '@/lib/prisma'

export interface AppSession {
  memberId?: string
  userId?: string
  role: 'ADMIN' | 'MEMBER'
  source: 'oauth' | 'magic-link'
  email?: string
}

export async function getAppSession(): Promise<AppSession | null> {
  // 1. Try NextAuth OAuth session
  const oauthSession = await getServerSession(authOptions)
  if (oauthSession?.user) {
    const role = (oauthSession.user.role as string) === 'ADMIN' ? 'ADMIN' : 'MEMBER'
    return {
      userId: oauthSession.user.id,
      memberId: (oauthSession.user as { memberId?: string }).memberId,
      role,
      source: 'oauth',
      email: oauthSession.user.email ?? undefined,
    }
  }

  // 2. Try magic-link member_session cookie
  const cookieStore = cookies()
  const memberSessionToken = cookieStore.get('member_session')?.value
  if (memberSessionToken) {
    const payload = await verifyMemberSessionJWT(memberSessionToken)
    if (payload?.memberId) {
      return {
        memberId: payload.memberId,
        role: 'MEMBER',
        source: 'magic-link',
      }
    }
  }

  return null
}

/** Convenience: get the full Member record for the current session */
export async function getSessionMember() {
  const session = await getAppSession()
  if (!session?.memberId) return null
  return prisma.member.findUnique({
    where: { id: session.memberId },
    include: { plan: true },
  })
}
