import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { verifyMemberSessionJWT } from '@/lib/tokens'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // ── Admin routes: require OAuth session with ADMIN role ──────────────────
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
      return NextResponse.redirect(new URL('/login?callbackUrl=/admin/dashboard', req.url))
    }
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL('/member/dashboard', req.url))
    }
    return NextResponse.next()
  }

  // ── Member routes: allow OAuth session OR valid magic-link cookie ─────────
  if (pathname.startsWith('/member')) {
    // Check NextAuth session first
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (token) return NextResponse.next()

    // Check magic-link session cookie
    const memberSessionToken = req.cookies.get('member_session')?.value
    if (memberSessionToken) {
      const payload = await verifyMemberSessionJWT(memberSessionToken)
      if (payload?.memberId) return NextResponse.next()
    }

    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/member/:path*'],
}
