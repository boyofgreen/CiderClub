import { describe, it, expect, beforeEach } from 'vitest'
import { prisma, resetDb } from '../helpers/prismaTestClient'
import {
  createOrganization,
  getUserOrgMemberships,
  userHasOrgRole,
  ensureOrgMembership,
  validateOrgSlug,
  slugifyOrgName,
} from '@/services/orgs'
import { DEFAULT_ORG_ID } from '@/lib/tenancy'

beforeEach(async () => {
  await resetDb()
})

async function createUser(email = `user-${Math.random().toString(36).slice(2, 8)}@test.local`) {
  return prisma.user.create({ data: { email, name: 'Test Operator' } })
}

describe('createOrganization', () => {
  it('creates the org with an OWNER membership and a 30-day trial', async () => {
    const user = await createUser()
    const org = await createOrganization({
      name: 'Bluebird Cidery',
      slug: 'bluebird-cidery',
      ownerUserId: user.id,
    })

    expect(org.slug).toBe('bluebird-cidery')
    expect(org.planTier).toBe('TRIAL')
    expect(org.trialEndsAt).not.toBeNull()

    const memberships = await getUserOrgMemberships(user.id)
    expect(memberships).toEqual([{ slug: 'bluebird-cidery', role: 'OWNER' }])
    expect(await userHasOrgRole(user.id, 'bluebird-cidery', ['OWNER'])).toBe(true)
    expect(await userHasOrgRole(user.id, 'bluebird-cidery', ['STAFF'])).toBe(false)
  })

  it('rejects duplicate slugs', async () => {
    const user = await createUser()
    await createOrganization({ name: 'First', slug: 'bluebird', ownerUserId: user.id })
    await expect(
      createOrganization({ name: 'Second', slug: 'bluebird', ownerUserId: user.id })
    ).rejects.toThrow(/already taken/)
  })

  it('rejects reserved and malformed slugs', async () => {
    const user = await createUser()
    await expect(
      createOrganization({ name: 'Nope', slug: 'admin', ownerUserId: user.id })
    ).rejects.toThrow(/reserved/)
    await expect(
      createOrganization({ name: 'Nope', slug: 'Bad Slug!', ownerUserId: user.id })
    ).rejects.toThrow(/lowercase/)
  })

  it('a user can own multiple orgs', async () => {
    const user = await createUser()
    await createOrganization({ name: 'One', slug: 'one-cidery', ownerUserId: user.id })
    await createOrganization({ name: 'Two', slug: 'two-cidery', ownerUserId: user.id })
    const memberships = await getUserOrgMemberships(user.id)
    expect(memberships.map((m) => m.slug).sort()).toEqual(['one-cidery', 'two-cidery'])
  })
})

describe('ensureOrgMembership (admin bootstrap)', () => {
  it('is idempotent and does not downgrade an existing role', async () => {
    const user = await createUser()
    // Default org row is created lazily by the tenancy layer on first query
    await prisma.setting.findFirst({ where: { key: 'anything' } })

    await ensureOrgMembership(user.id, DEFAULT_ORG_ID, 'OWNER')
    await ensureOrgMembership(user.id, DEFAULT_ORG_ID, 'STAFF') // no-op update
    const memberships = await getUserOrgMemberships(user.id)
    expect(memberships).toHaveLength(1)
    expect(memberships[0].role).toBe('OWNER')
  })
})

describe('slug helpers', () => {
  it('slugifies names sensibly', () => {
    expect(slugifyOrgName("Bluebird Cidery & Co.")).toBe('bluebird-cidery-co')
    expect(slugifyOrgName('  Hill   Country  ')).toBe('hill-country')
  })

  it('validates slugs', () => {
    expect(validateOrgSlug('bluebird')).toBeNull()
    expect(validateOrgSlug('www')).toMatch(/reserved/)
    expect(validateOrgSlug('ab')).toMatch(/lowercase/)
    expect(validateOrgSlug('-bad')).toMatch(/lowercase/)
  })
})
