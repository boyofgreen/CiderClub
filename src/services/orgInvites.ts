import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/services/email/sender'
import { baseTemplate } from '@/lib/emailTemplates'
import { getContextOrgId, resolveOrgId } from '@/lib/tenancy'
import { portalUrlFor } from '@/lib/tenantUrls'
import { addDays } from 'date-fns'

const INVITE_TTL_DAYS = 14
const INVITABLE_ROLES = new Set(['ADMIN', 'STAFF'])

/**
 * Invite an operator to the current org's team. Re-inviting the same email
 * refreshes the pending invite (new expiry, updated role). Sends the invite
 * email; failures to send are non-fatal (the admin UI shows the link too).
 */
export async function createInvite(params: {
  email: string
  role: string
  invitedById?: string
  invitedByName?: string
}) {
  const email = params.email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Enter a valid email address.')
  }
  if (!INVITABLE_ROLES.has(params.role)) {
    throw new Error('Role must be ADMIN or STAFF.')
  }

  // Already on the team?
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  })
  if (existingUser) {
    const orgId = getContextOrgId() ?? (await resolveOrgId(prisma))
    const existingMembership = await prisma.organizationUser.findUnique({
      where: { organizationId_userId: { organizationId: orgId, userId: existingUser.id } },
      select: { id: true },
    })
    if (existingMembership) throw new Error('That person is already on the team.')
  }

  const expiresAt = addDays(new Date(), INVITE_TTL_DAYS)

  // Refresh any pending invite for this email (org-scoped via extension)
  const pending = await prisma.orgInvite.findFirst({ where: { email } })
  const invite = pending
    ? await prisma.orgInvite.update({
        where: { id: pending.id },
        data: { role: params.role, expiresAt, acceptedAt: null, invitedById: params.invitedById },
        include: { organization: { select: { name: true, slug: true } } },
      })
    : await prisma.orgInvite.create({
        data: { email, role: params.role, expiresAt, invitedById: params.invitedById },
        include: { organization: { select: { name: true, slug: true } } },
      })

  const inviteUrl = `${portalUrlFor(invite.organization.slug)}/invite/${invite.token}`

  await sendEmail({
    to: email,
    subject: `You've been invited to help run ${invite.organization.name}`,
    html: baseTemplate(`
      <h2>Join the ${invite.organization.name} team</h2>
      <p>${params.invitedByName ?? 'A team member'} invited you to help manage ${invite.organization.name}'s member club${params.role === 'STAFF' ? ' as staff' : ' as an admin'}.</p>
      <p style="text-align:center"><a class="btn" href="${inviteUrl}">Accept Invitation</a></p>
      <p>This invitation expires in ${INVITE_TTL_DAYS} days. If you weren't expecting it, you can ignore this email.</p>
    `),
    type: 'ORG_INVITE',
    metadata: { inviteId: invite.id, role: params.role },
  }).catch((err) => console.error('[invites] Failed to send invite email:', err))

  return { invite, inviteUrl }
}

export type AcceptInviteResult =
  | { ok: true; orgSlug: string; orgName: string }
  | { ok: false; reason: 'not_found' | 'expired' | 'email_mismatch' }

/**
 * Accept an invite by token for the signed-in user. The signed-in email must
 * match the invited email (invites are personal — forwarding the link must
 * not grant access to someone else).
 */
export async function acceptInvite(params: {
  token: string
  userId: string
  userEmail: string
}): Promise<AcceptInviteResult> {
  // findUnique by token — deliberately cross-org (acceptance happens wherever
  // the recipient clicks the link)
  const invite = await prisma.orgInvite.findUnique({
    where: { token: params.token },
    include: { organization: { select: { id: true, name: true, slug: true } } },
  })

  if (!invite || invite.acceptedAt) return { ok: false, reason: 'not_found' }
  if (invite.expiresAt < new Date()) return { ok: false, reason: 'expired' }
  if (invite.email !== params.userEmail.toLowerCase()) {
    return { ok: false, reason: 'email_mismatch' }
  }

  await prisma.organizationUser.upsert({
    where: {
      organizationId_userId: {
        organizationId: invite.organization.id,
        userId: params.userId,
      },
    },
    create: {
      organizationId: invite.organization.id,
      userId: params.userId,
      role: invite.role,
    },
    update: {},
  })
  await prisma.orgInvite.update({
    where: { id: invite.id },
    data: { acceptedAt: new Date() },
  })

  return { ok: true, orgSlug: invite.organization.slug, orgName: invite.organization.name }
}

/** Operators + pending invites for the current org (team page). */
export async function listTeam() {
  const orgId = getContextOrgId() ?? (await resolveOrgId(prisma))
  const operators = await prisma.organizationUser.findMany({
    where: { organizationId: orgId },
    include: { user: { select: { name: true, email: true, image: true } } },
    orderBy: { createdAt: 'asc' },
  })
  const invites = await prisma.orgInvite.findMany({
    where: { acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })
  return { operators, invites }
}

export async function revokeInvite(inviteId: string): Promise<void> {
  // deleteMany (not delete) so the org scope applies — an admin of org A
  // cannot revoke org B's invite by guessing ids
  await prisma.orgInvite.deleteMany({ where: { id: inviteId } })
}

/**
 * Remove an operator from the current org. Guards: OWNERs can only be
 * removed by an OWNER, and the last OWNER can never be removed.
 */
export async function removeOperator(params: {
  orgUserId: string
  actingRole: string
  actingIsSuperAdmin?: boolean
}): Promise<void> {
  const orgId = getContextOrgId() ?? (await resolveOrgId(prisma))
  const target = await prisma.organizationUser.findFirst({
    where: { id: params.orgUserId, organizationId: orgId },
  })
  if (!target) throw new Error('Team member not found.')

  if (target.role === 'OWNER') {
    if (params.actingRole !== 'OWNER' && !params.actingIsSuperAdmin) {
      throw new Error('Only an owner can remove another owner.')
    }
    const ownerCount = await prisma.organizationUser.count({
      where: { organizationId: orgId, role: 'OWNER' },
    })
    if (ownerCount <= 1) {
      throw new Error('You cannot remove the last owner. Transfer ownership first.')
    }
  }

  await prisma.organizationUser.delete({ where: { id: target.id } })
}
