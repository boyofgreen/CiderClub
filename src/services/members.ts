import { prisma } from '@/lib/prisma'
import { createSquareCustomer } from '@/services/square/customers'
import { saveCardOnFile } from '@/services/square/cards'
import { sendEmail, buildWelcomeEmail } from '@/services/email/sender'
import { generateOpaqueToken } from '@/lib/tokens'
import { getMemberPortalToken } from '@/services/orders'
import { appUrl } from '@/lib/resend'
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
    const squareCustomerId = await createSquareCustomer(member)

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

  await sendEmail({
    to: member.email,
    subject: `Welcome to ${plan.name}!`,
    html: buildWelcomeEmail({
      firstName: params.firstName,
      planName: plan.name,
      portalUrl,
    }),
    type: 'WELCOME',
    memberId: member.id,
    metadata: { planId: params.planId, status },
  })

  return { member, status, portalUrl }
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
