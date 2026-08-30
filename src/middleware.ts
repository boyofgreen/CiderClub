import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { verifyMemberSessionJWT } from '@/lib/tokens'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // ── club.* subdomain: serve the cider club page at the root ──────────────
  // Every custom domain points at this one app, so the club subdomain would
  // otherwise show the marketing homepage. Rewrite (not redirect) so the URL
  // stays club.hillcountryciderhouse.com — every other path is untouched, which
  // keeps existing magic links and member bookmarks working.
  if (pathname === '/') {
    const host = req.headers.get('host')?.toLowerCase() ?? ''
    if (host.startsWith('club.')) {
      return NextResponse.rewrite(new URL('/club', req.url))
    }
  }

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
  matcher: ['/', '/admin/:path*', '/member/:path*'],
}
