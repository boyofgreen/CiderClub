import { prisma } from '@/lib/prisma'
import { createSquareCustomer } from '@/services/square/customers'
import { saveCardOnFile } from '@/services/square/cards'
import { sendEmail } from '@/services/email/sender'
import { renderEmail, baseTemplate } from '@/lib/emailTemplates'
import { generateOpaqueToken } from '@/lib/tokens'
import { appUrl, clubName } from '@/lib/resend'
import { getAdminNotifyEmail, getWelcomeFollowupFrom } from '@/lib/settings'
import { addDays } from 'date-fns'

interface CreateMemberParams {
  email: string
  firstName: string
  lastName: string
  phone?: string
  address1?: string
  city?: string
  state?: string
  zip?: string
  planId: string
  referralCode?: string
  cardNonce?: string // Square Web Payments nonce (optional)
}

/** Create a new member, link to Square, optionally save card, send welcome email */
export async function createMember(params: CreateMemberParams) {
  // Resolve referral
  let referredByMemberId: string | undefined
  if (params.referralCode) {
    const referrer = await prisma.member.findUnique({
      where: { referralCode: params.referralCode },
    })
    referredByMemberId = referrer?.id
  }

  // Check plan capacity
  const plan = await prisma.plan.findUniqueOrThrow({ where: { id: params.planId } })
  let status = 'ACTIVE'

  if (plan.maxCapacity != null) {
    const activeCount = await prisma.member.count({
      where: { planId: params.planId, status: 'ACTIVE' },
    })
    if (activeCount >= plan.maxCapacity) {
      status = 'WAITLIST'
    }
  }

  // Create the member record (no User record required)
  const member = await prisma.member.create({
    data: {
      email: params.email.toLowerCase(),
      firstName: params.firstName,
      lastName: params.lastName,
      phone: params.phone,
      address1: params.address1,
      city: params.city,
      state: params.state,
      zip: params.zip,
      planId: params.planId,
      status,
      referredByMemberId,
    },
  })

  // Add to waitlist table if needed
  if (status === 'WAITLIST') {
    const position = (await prisma.waitlistEntry.count({ where: { planId: params.planId } })) + 1
    await prisma.waitlistEntry.create({
      data: {
        memberId: member.id,
        email: member.email,
        name: `${params.firstName} ${params.lastName}`,
        planId: params.planId,
        position,
      },
    })
  }

  // Create Square customer (async, don't block member creation if it fails)
  try {
    const squareCustomerId = await createSquareCustomer(member, plan.name, member.createdAt)

    // Save card on file if nonce provided
    if (params.cardNonce && squareCustomerId) {
      await saveCardOnFile({
        memberId: member.id,
        squareCustomerId,
        cardNonce: params.cardNonce,
        cardholderName: `${params.firstName} ${params.lastName}`,
      })
    }
  } catch (err) {
    console.error('Square customer setup failed:', err)
    // Don't fail the member creation — admin can sync later
  }

  // Create a general access token and send welcome email
  const token = generateOpaqueToken()
  await prisma.memberToken.create({
    data: {
      memberId: member.id,
      token,
      type: 'GENERAL',
      expiresAt: addDays(new Date(), 90),
    },
  })

  const portalUrl = `${appUrl}/magic?t=${token}`

  // 1. Welcome / sign-up confirmation (editable template)
  const welcome = await renderEmail('WELCOME', {
    firstName: params.firstName,
    planName: plan.name,
    portalUrl,
  })
  await sendEmail({
    to: member.email,
    subject: welcome.subject,
    html: welcome.html,
    type: 'WELCOME',
    memberId: member.id,
    metadata: { planId: params.planId, status },
  })

  // 2. Personal welcome from JB, scheduled ~24 hours out via Resend (no cron needed).
  //    Comes from the configured personal address so replies reach the owner.
  try {
    const followup = await renderEmail('WELCOME_FOLLOWUP', { firstName: params.firstName })
    await sendEmail({
      to: member.email,
      subject: followup.subject,
      html: followup.html,
      type: 'WELCOME_FOLLOWUP',
      memberId: member.id,
      from: await getWelcomeFollowupFrom(),
      scheduledAt: addHoursIso(24),
    })
  } catch (err) {
    console.error('[members] Failed to schedule welcome follow-up:', err)
  }

  // 3. Internal alert to the owner so new members can be tracked (not editable).
  try {
    const notifyTo = await getAdminNotifyEmail()
    if (notifyTo) {
      await sendEmail({
        to: notifyTo,
        subject: `New member: ${params.firstName} ${params.lastName} (${plan.name})`,
        html: buildAdminNewMemberAlert({
          firstName: params.firstName,
          lastName: params.lastName,
          email: member.email,
          phone: params.phone,
          planName: plan.name,
          status,
        }),
        type: 'ADMIN_NEW_MEMBER',
      })
    }
  } catch (err) {
    console.error('[members] Failed to send admin new-member alert:', err)
  }

  return { member, status, portalUrl }
}

/** ISO timestamp N hours from now — for Resend scheduled sends */
function addHoursIso(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()
}

/** Internal new-member alert to the owner. Intentionally not admin-editable. */
function buildAdminNewMemberAlert(p: {
  firstName: string
  lastName: string
  email: string
  phone?: string
  planName: string
  status: string
}): string {
  return baseTemplate(`
    <h2>New ${clubName} Member</h2>
    <p>A new member just signed up:</p>
    <ul>
      <li><strong>Name:</strong> ${p.firstName} ${p.lastName}</li>
      <li><strong>Email:</strong> ${p.email}</li>
      ${p.phone ? `<li><strong>Phone:</strong> ${p.phone}</li>` : ''}
      <li><strong>Plan:</strong> ${p.planName}</li>
      <li><strong>Status:</strong> ${p.status}</li>
    </ul>
    <p style="text-align:center"><a class="btn" href="${appUrl}/admin/members">View in Admin</a></p>
  `)
}

/** Pause a member (optionally until a specific quarter) */
export async function pauseMember(
  memberId: string,
  pausedUntilQuarter?: string,
  reason?: string
): Promise<void> {
  await prisma.member.update({
    where: { id: memberId },
    data: {
      status: 'PAUSED',
      pausedAt: new Date(),
      pausedUntilQuarter: pausedUntilQuarter ?? null,
      notes: reason
        ? `[Paused] ${reason}`
        : undefined,
    },
  })
}

/** Cancel a member */
export async function cancelMember(memberId: string, reason?: string): Promise<void> {
  await prisma.member.update({
    where: { id: memberId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  })
}

/** Reactivate a paused or cancelled member */
export async function reactivateMember(memberId: string): Promise<void> {
  await prisma.member.update({
    where: { id: memberId },
    data: {
      status: 'ACTIVE',
      pausedAt: null,
      pausedUntilQuarter: null,
      cancelledAt: null,
      cancellationReason: null,
    },
  })
}
