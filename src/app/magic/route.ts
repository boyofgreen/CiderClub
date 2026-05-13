/**
 * Magic link handler — GET /magic?t=TOKEN[&next=/member/orders/123]
 * Validates the opaque token, creates a signed member_session JWT cookie,
 * and redirects to the member portal (or the `next` URL if provided).
 */
import { NextResponse, type NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createMemberSessionJWT } from '@/lib/tokens'
import { appUrl } from '@/lib/resend'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  const next = req.nextUrl.searchParams.get('next') ?? '/member/dashboard'

  if (!token) {
    return NextResponse.redirect(new URL('/magic/request?error=missing_token', appUrl))
  }

  const memberToken = await prisma.memberToken.findUnique({
    where: { token },
    include: { member: true },
  })

  if (!memberToken || memberToken.expiresAt < new Date()) {
    return NextResponse.redirect(new URL('/magic/request?error=expired', appUrl))
  }

  if (memberToken.member.status === 'CANCELLED') {
    return NextResponse.redirect(new URL('/magic/request?error=cancelled', appUrl))
  }

  // Update last used timestamp
  await prisma.memberToken.update({
    where: { id: memberToken.id },
    data: { lastUsedAt: new Date() },
  })

  // Create a signed member session JWT (30 days)
  const sessionJwt = await createMemberSessionJWT(memberToken.memberId)

  // Redirect to intended destination with session cookie set
  const redirectUrl = new URL(next.startsWith('/') ? next : '/member/dashboard', appUrl)
  const response = NextResponse.redirect(redirectUrl)

  response.cookies.set('member_session', sessionJwt, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  })

  return response
}
