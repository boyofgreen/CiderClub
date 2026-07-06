import { prisma } from '@/lib/prisma'

export const ORG_ROLES = ['OWNER', 'ADMIN', 'STAFF'] as const
export type OrgRole = (typeof ORG_ROLES)[number]

// Slugs that can never be tenant subdomains.
const RESERVED_SLUGS = new Set([
  'www', 'app', 'api', 'admin', 'platform', 'mail', 'email', 'staging', 'dev',
  'test', 'demo', 'help', 'support', 'docs', 'blog', 'status', 'assets', 'cdn',
  'login', 'signup', 'onboarding', 'billing', 'dashboard',
])

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/

export function slugifyOrgName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function validateOrgSlug(slug: string): string | null {
  if (!SLUG_PATTERN.test(slug)) {
    return 'Use 3-48 lowercase letters, numbers, and hyphens (no leading/trailing hyphen).'
  }
  if (RESERVED_SLUGS.has(slug)) {
    return 'That address is reserved — please choose another.'
  }
  return null
}

export interface CreateOrganizationParams {
  name: string
  slug: string
  ownerUserId: string
}

/**
 * Create a new tenant: the Organization plus an OWNER membership for the
 * creating user. Throws Error with a user-presentable message on validation
 * failure or slug collision.
 */
export async function createOrganization(params: CreateOrganizationParams) {
  const name = params.name.trim()
  const slug = params.slug.trim().toLowerCase()

  if (name.length < 2 || name.length > 80) {
    throw new Error('Organization name must be 2-80 characters.')
  }
  const slugError = validateOrgSlug(slug)
  if (slugError) throw new Error(slugError)

  const existing = await prisma.organization.findUnique({ where: { slug }, select: { id: true } })
  if (existing) throw new Error('That address is already taken — please choose another.')

  const org = await prisma.organization.create({
    data: {
      name,
      slug,
      planTier: 'TRIAL',
      trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30-day trial
      users: {
        create: { userId: params.ownerUserId, role: 'OWNER' },
      },
    },
  })

  return org
}

/** All org memberships for a user, as { slug, role } for JWT embedding. */
export async function getUserOrgMemberships(
  userId: string
): Promise<{ slug: string; role: string }[]> {
  const rows = await prisma.organizationUser.findMany({
    where: { userId },
    include: { organization: { select: { slug: true } } },
    orderBy: { createdAt: 'asc' },
  })
  return rows.map((r) => ({ slug: r.organization.slug, role: r.role }))
}

/** Does the user hold one of the given roles in the org with this slug? */
export async function userHasOrgRole(
  userId: string,
  orgSlug: string,
  roles: readonly string[] = ORG_ROLES
): Promise<boolean> {
  const row = await prisma.organizationUser.findFirst({
    where: { userId, role: { in: [...roles] }, organization: { slug: orgSlug } },
    select: { id: true },
  })
  return Boolean(row)
}

/** Ensure a membership exists (bootstrap path for legacy env-var admins). */
export async function ensureOrgMembership(
  userId: string,
  organizationId: string,
  role: OrgRole
): Promise<void> {
  await prisma.organizationUser.upsert({
    where: { organizationId_userId: { organizationId, userId } },
    create: { organizationId, userId, role },
    update: {},
  })
}
