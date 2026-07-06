import { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import FacebookProvider from 'next-auth/providers/facebook'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import { config } from '@/lib/config'

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
      const adminEmails = getAdminEmails()

      // Always allow admins
      if (adminEmails.includes(email)) return true

      // Allow existing members (matched by email)
      const member = await prisma.member.findFirst({ where: { email } })
      if (member && member.status !== 'CANCELLED') return true

      // Deny everyone else — they should use the magic link or sign up first
      return '/login?error=not_a_member'
    },

    // Embed id, role, and memberId into the JWT
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        const email = user.email?.toLowerCase() ?? ''
        const adminEmails = getAdminEmails()

        if (adminEmails.includes(email)) {
          token.role = 'ADMIN'
          // Update role in DB
          await prisma.user.update({ where: { id: user.id }, data: { role: 'ADMIN' } }).catch(() => {})
        } else {
          token.role = 'MEMBER'
          // Find and link member record
          const member = await prisma.member.findFirst({ where: { email } })
          if (member) {
            token.memberId = member.id
            // Link OAuth user to member record if not already linked
            if (!member.userId) {
              await prisma.member.update({
                where: { id: member.id },
                data: { userId: user.id },
              }).catch(() => {})
            }
          }
        }
      }
      return token
    },

    // Expose id, role, and memberId on the session object
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.memberId = token.memberId as string | undefined
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
