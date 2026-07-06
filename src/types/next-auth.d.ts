import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

interface OrgMembership {
  slug: string
  role: string // OWNER | ADMIN | STAFF
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      /** Effective role for the request's tenant: 'ADMIN' if operator of this org (or superadmin), else 'MEMBER' */
      role: string
      /** Org-level role for the request's tenant (OWNER | ADMIN | STAFF), if any */
      orgRole?: string | null
      /** Platform superadmin — full access to every organization */
      isSuperAdmin?: boolean
      /** All org memberships (for the org switcher / onboarding) */
      memberships?: OrgMembership[]
      memberId?: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: string
    memberId?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    role: string
    isSuperAdmin?: boolean
    memberships?: OrgMembership[]
    memberId?: string
  }
}
