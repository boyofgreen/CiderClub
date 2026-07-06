import { describe, it, expect, beforeEach } from 'vitest'
import { prisma, resetDb } from '../helpers/prismaTestClient'
import { createInvite, acceptInvite, revokeInvite, listTeam, removeOperator } from '@/services/orgInvites'
import { createOrganization, getUserOrgMemberships } from '@/services/orgs'
import { runWithOrg, DEFAULT_ORG_ID } from '../../src/lib/tenancy'

beforeEach(async () => {
  await resetDb()
})

let userSeq = 0
async function createUser(email?: string) {
  return prisma.user.create({
    data: { email: email ?? `op-${++userSeq}@test.local`, name: `Operator ${userSeq}` },
  })
}

describe('org invites', () => {
  it('creates an invite, logs the email, and accepting grants the role', async () => {
    const invitee = await createUser('newadmin@test.local')

    const { invite, inviteUrl } = await createInvite({ email: 'NewAdmin@Test.Local', role: 'STAFF' })
    expect(invite.email).toBe('newadmin@test.local')
    expect(inviteUrl).toContain(`/invite/${invite.token}`)

    const log = await prisma.emailLog.findFirst({ where: { type: 'ORG_INVITE' } })
    expect(log?.toEmail).toBe('newadmin@test.local')

    const result = await acceptInvite({
      token: invite.token,
      userId: invitee.id,
      userEmail: 'newadmin@test.local',
    })
    expect(result).toMatchObject({ ok: true })

    const memberships = await getUserOrgMemberships(invitee.id)
    expect(memberships).toHaveLength(1)
    expect(memberships[0].role).toBe('STAFF')

    // Accepted invites can't be reused
    const again = await acceptInvite({
      token: invite.token,
      userId: invitee.id,
      userEmail: 'newadmin@test.local',
    })
    expect(again).toMatchObject({ ok: false, reason: 'not_found' })
  })

  it('rejects acceptance from a different email (forwarded link)', async () => {
    const wrongPerson = await createUser('someone-else@test.local')
    const { invite } = await createInvite({ email: 'intended@test.local', role: 'ADMIN' })

    const result = await acceptInvite({
      token: invite.token,
      userId: wrongPerson.id,
      userEmail: 'someone-else@test.local',
    })
    expect(result).toMatchObject({ ok: false, reason: 'email_mismatch' })
    expect(await getUserOrgMemberships(wrongPerson.id)).toHaveLength(0)
  })

  it('rejects expired invites', async () => {
    const invitee = await createUser('late@test.local')
    const { invite } = await createInvite({ email: 'late@test.local', role: 'ADMIN' })
    await prisma.orgInvite.update({
      where: { id: invite.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    })

    const result = await acceptInvite({
      token: invite.token,
      userId: invitee.id,
      userEmail: 'late@test.local',
    })
    expect(result).toMatchObject({ ok: false, reason: 'expired' })
  })

  it('re-inviting refreshes the pending invite instead of duplicating', async () => {
    await createInvite({ email: 'dupe@test.local', role: 'ADMIN' })
    const second = await createInvite({ email: 'dupe@test.local', role: 'STAFF' })

    const all = await prisma.orgInvite.findMany({ where: { email: 'dupe@test.local' } })
    expect(all).toHaveLength(1)
    expect(all[0].role).toBe('STAFF')
    expect(second.invite.id).toBe(all[0].id)
  })

  it('refuses to invite someone already on the team', async () => {
    const owner = await createUser('owner@test.local')
    await createOrganization({ name: 'Bluebird', slug: 'bluebird', ownerUserId: owner.id })

    await expect(
      runWithOrg(
        (await prisma.organization.findUniqueOrThrow({ where: { slug: 'bluebird' } })).id,
        () => createInvite({ email: 'owner@test.local', role: 'ADMIN' })
      )
    ).rejects.toThrow(/already on the team/)
  })

  it('invites are tenant-scoped; revoke cannot cross orgs', async () => {
    const owner = await createUser()
    const orgB = await createOrganization({ name: 'Bluebird', slug: 'bluebird', ownerUserId: owner.id })

    const defaultInvite = await createInvite({ email: 'a@test.local', role: 'ADMIN' })
    await runWithOrg(orgB.id, () => createInvite({ email: 'b@test.local', role: 'ADMIN' }))

    // Org B's team page sees only its own invite
    const teamB = await runWithOrg(orgB.id, () => listTeam())
    expect(teamB.invites.map((i) => i.email)).toEqual(['b@test.local'])

    // Org B revoking the default org's invite id is a no-op
    await runWithOrg(orgB.id, () => revokeInvite(defaultInvite.invite.id))
    expect(await prisma.orgInvite.findFirst({ where: { email: 'a@test.local' } })).not.toBeNull()
  })

  it('protects the last owner from removal', async () => {
    const owner = await createUser()
    const org = await createOrganization({ name: 'Solo', slug: 'solo-cidery', ownerUserId: owner.id })
    const membership = await prisma.organizationUser.findFirstOrThrow({
      where: { organizationId: org.id },
    })

    await expect(
      runWithOrg(org.id, () =>
        removeOperator({ orgUserId: membership.id, actingRole: 'OWNER' })
      )
    ).rejects.toThrow(/last owner/)

    // STAFF cannot remove an OWNER even when another owner exists
    const second = await createUser()
    await prisma.organizationUser.create({
      data: { organizationId: org.id, userId: second.id, role: 'OWNER' },
    })
    await expect(
      runWithOrg(org.id, () =>
        removeOperator({ orgUserId: membership.id, actingRole: 'STAFF' })
      )
    ).rejects.toThrow(/Only an owner/)

    // An OWNER can remove another owner when two exist
    await runWithOrg(org.id, () =>
      removeOperator({ orgUserId: membership.id, actingRole: 'OWNER' })
    )
    expect(await getUserOrgMemberships(owner.id)).toHaveLength(0)
  })

  it('default-context invites land in tenant zero', async () => {
    const { invite } = await createInvite({ email: 'default@test.local', role: 'ADMIN' })
    expect(invite.organizationId).toBe(DEFAULT_ORG_ID)
  })
})
