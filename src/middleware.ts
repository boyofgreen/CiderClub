import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { verifyMemberSessionJWT } from '@/lib/tokens'
import { config as appConfig } from '@/lib/config'
import { parseTenantHost, ORG_SLUG_HEADER, ORG_DOMAIN_HEADER, DEFAULT_ORG_SLUG } from '@/lib/tenantHost'

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  // ── Tenant resolution: Host header → trusted x-org-* request headers ──────
  // Always strip inbound x-org-* headers first so clients can't spoof a tenant.
  const requestHeaders = new Headers(req.headers)
  requestHeaders.delete(ORG_SLUG_HEADER)
  requestHeaders.delete(ORG_DOMAIN_HEADER)

  const tenant = parseTenantHost(req.headers.get('host'), appConfig.app.rootDomain)
  if (tenant.type === 'subdomain') {
    requestHeaders.set(ORG_SLUG_HEADER, tenant.slug)
  } else if (tenant.type === 'custom-domain') {
    requestHeaders.set(ORG_DOMAIN_HEADER, tenant.domain)
  }

  const withTenantHeaders = () => NextResponse.next({ request: { headers: requestHeaders } })

  // ── Admin routes: require an operator of THIS tenant (or superadmin) ──────
  if (pathname.startsWith('/admin')) {
    const token = await getToken({ req, secret: appConfig.auth.secret })
    if (!token) {
      return NextResponse.redirect(new URL('/login?callbackUrl=/admin/dashboard', req.url))
    }

    const memberships = (token.memberships ?? []) as { slug: string; role: string }[]
    // Platform host administers tenant zero. Custom domains can't be mapped to
    // a slug at the edge — allow any operator through; server-side session
    // role (computed per-tenant) remains the authoritative check.
    const slugForHost =
      tenant.type === 'subdomain' ? tenant.slug : tenant.type === 'platform' ? DEFAULT_ORG_SLUG : null
    const isOperator =
      Boolean(token.isSuperAdmin) ||
      token.role === 'ADMIN' || // legacy sessions issued before org roles
      (slugForHost ? memberships.some((m) => m.slug === slugForHost) : memberships.length > 0)

    if (!isOperator) {
      return NextResponse.redirect(new URL('/member/dashboard', req.url))
    }
    return withTenantHeaders()
  }

  // ── Member routes: allow OAuth session OR valid magic-link cookie ─────────
  if (pathname.startsWith('/member')) {
    // Check NextAuth session first
    const token = await getToken({ req, secret: appConfig.auth.secret })
    if (token) return withTenantHeaders()

    // Check magic-link session cookie
    const memberSessionToken = req.cookies.get('member_session')?.value
    if (memberSessionToken) {
      const payload = await verifyMemberSessionJWT(memberSessionToken)
      if (payload?.memberId) return withTenantHeaders()
    }

    return NextResponse.redirect(new URL('/login', req.url))
  }

  return withTenantHeaders()
}

export const config = {
  // Run on every route except Next.js internals and static files (anything
  // with a file extension) — tenant headers must be present on pages and API
  // routes alike.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
