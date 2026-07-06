import { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { config } from '@/lib/config'
import { DEFAULT_ORG_ID, DEFAULT_ORG_SLUG } from '@/lib/tenantHost'
import { resolveRequestOrgSlug, isTenantRequest } from '@/lib/tenantRequest'
import { getUserOrgMemberships, ensureOrgMembership } from '@/services/orgs'

function getAdminEmails(): string[] {
  return config.auth.adminEmails
}

export const authOptions: NextAuthOptions = {
  // Cast: @next-auth/prisma-adapter expects PrismaClient from `@prisma/client`,
  // but we generate to a custom path (`prisma-generated`) — same client at runtime.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  adapter: PrismaAdapter(prisma as any),
  // JWT strategy so sessions work without a DB lookup on every request
  session: { strategy: 'jwt' },

  providers: [
    GoogleProvider({
      clientId: config.auth.google.clientId,
      clientSecret: config.auth.google.clientSecret,
    }),
    FacebookProvider({
      clientId: config.auth.facebook.clientId,
      clientSecret: config.auth.facebook.clientSecret,
    }),
  ],

  callbacks: {
    // Control who can sign in via OAuth
    async signIn({ user }) {
      if (!user.email) return false

      const email = user.email.toLowerCase()

      // Bootstrap admins (env var) always get in
      if (getAdminEmails().includes(email)) return true

      // Operators: anyone with an org membership
      const dbUser = await prisma.user.findUnique({
        where: { email },
        select: { isSuperAdmin: true, orgMemberships: { select: { id: true }, take: 1 } },
      })
      if (dbUser?.isSuperAdmin || (dbUser?.orgMemberships.length ?? 0) > 0) return true

      // Club members of THIS tenant (query is org-scoped by the request host)
      const member = await prisma.member.findFirst({ where: { email } })
      if (member && member.status !== 'CANCELLED') return true

      // Platform host (no tenant): open sign-in so new operators can onboard
      if (!isTenantRequest()) return true

      // Tenant host, no relationship — use the magic link or sign up first
      return '/login?error=not_a_member'
    },

    // Embed id, superadmin flag, org memberships, and memberId into the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        const email = user.email?.toLowerCase() ?? ''

        // Bootstrap: env-var admins become superadmin + OWNER of tenant zero.
        if (getAdminEmails().includes(email)) {
          await prisma.user
            .update({ where: { id: user.id }, data: { role: 'ADMIN', isSuperAdmin: true } })
            .catch(() => {})
          await ensureOrgMembership(user.id, DEFAULT_ORG_ID, 'OWNER').catch(() => {})
        }

        // Link club-member record for this tenant (org-scoped by request host)
        const member = await prisma.member.findFirst({ where: { email } })
        if (member) {
          token.memberId = member.id
          if (!member.userId) {
            await prisma.member
              .update({ where: { id: member.id }, data: { userId: user.id } })
              .catch(() => {})
          }
        }
      }

      // Refresh superadmin + memberships on every token pass so newly created
      // orgs are usable without re-login. One indexed query — cheap at our
      // scale; add a short cache if it ever shows up in traces.
      if (token.id) {
        const dbUser = await prisma.user
          .findUnique({ where: { id: token.id as string }, select: { isSuperAdmin: true } })
          .catch(() => null)
        token.isSuperAdmin = dbUser?.isSuperAdmin ?? false
        token.memberships = await getUserOrgMemberships(token.id as string).catch(() => [])
        // Legacy field — real authorization derives from memberships per org
        token.role = token.isSuperAdmin || token.memberships.length > 0 ? 'ADMIN' : 'MEMBER'
      }
      return token
    },

    // Expose id, effective per-tenant role, memberships, and memberId
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.memberId = token.memberId as string | undefined
        session.user.isSuperAdmin = Boolean(token.isSuperAdmin)
        session.user.memberships = (token.memberships as { slug: string; role: string }[]) ?? []

        // Effective role for THIS request's tenant (platform host = tenant zero)
        const requestSlug = (await resolveRequestOrgSlug().catch(() => null)) ?? DEFAULT_ORG_SLUG
        const membership = session.user.memberships.find((m) => m.slug === requestSlug)
        session.user.orgRole = membership?.role ?? (session.user.isSuperAdmin ? 'OWNER' : null)
        session.user.role = session.user.isSuperAdmin || membership ? 'ADMIN' : 'MEMBER'
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  secret: config.auth.secret,
}
