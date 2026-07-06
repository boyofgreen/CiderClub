import { describe, it, expect, beforeEach } from 'vitest'
import { prisma, resetDb } from '../helpers/prismaTestClient'
import { squareState, resetSquareState } from '../helpers/squareMock'
import { createPlan, createMember } from '../helpers/fixtures'
import { createMember as createMemberService, pauseMember, cancelMember, reactivateMember } from '@/services/members'

beforeEach(async () => {
  await resetDb()
  resetSquareState()
})

describe('createMember', () => {
  it('creates an active member, links Square, saves the card, and sends welcome emails', async () => {
    const plan = await createPlan()

    const result = await createMemberService({
      email: 'New.Member@Test.Local',
      firstName: 'New',
      lastName: 'Member',
      planId: plan.id,
      cardNonce: 'cnon:test-nonce',
    })

    expect(result.status).toBe('ACTIVE')
    expect(result.portalUrl).toContain('/magic?t=')

    const member = await prisma.member.findUniqueOrThrow({ where: { id: result.member.id } })
    expect(member.email).toBe('new.member@test.local') // lowercased
    expect(member.squareCustomerId).toMatch(/^sq-cust-/)
    expect(member.squareCardId).toMatch(/^sq-card-/)
    expect(squareState.customerCreates).toHaveLength(1)
    expect(squareState.cardCreates).toHaveLength(1)

    const token = await prisma.memberToken.findFirst({ where: { memberId: member.id, type: 'GENERAL' } })
    expect(token).not.toBeNull()

    const emailTypes = (await prisma.emailLog.findMany({ where: { memberId: member.id } })).map((e) => e.type)
    expect(emailTypes).toContain('WELCOME')
    expect(emailTypes).toContain('WELCOME_FOLLOWUP')
  })

  it('waitlists a member when the plan is at capacity', async () => {
    const plan = await createPlan({ maxCapacity: 1 })
    await createMember(plan.id) // fills the single slot

    const result = await createMemberService({
      email: 'waitlisted@test.local',
      firstName: 'Wait',
      lastName: 'Listed',
      planId: plan.id,
    })

    expect(result.status).toBe('WAITLIST')
    const entry = await prisma.waitlistEntry.findFirstOrThrow({
      where: { memberId: result.member.id },
    })
    expect(entry.position).toBe(1)
    expect(entry.planId).toBe(plan.id)
  })

  it('resolves a referral code to the referring member', async () => {
    const plan = await createPlan()
    const referrer = await createMember(plan.id)

    const result = await createMemberService({
      email: 'referred@test.local',
      firstName: 'Ref',
      lastName: 'Erred',
      planId: plan.id,
      referralCode: referrer.referralCode,
    })

    expect(result.member.referredByMemberId).toBe(referrer.id)
  })

  it('survives Square failure — member is still created without a customer id', async () => {
    const plan = await createPlan()
    const original = (await import('../helpers/squareMock')).squareClient.customers.create
    ;(await import('../helpers/squareMock')).squareClient.customers.create = async () => {
      throw new Error('Square is down')
    }
    try {
      const result = await createMemberService({
        email: 'nosquare@test.local',
        firstName: 'No',
        lastName: 'Square',
        planId: plan.id,
      })
      expect(result.status).toBe('ACTIVE')
      const member = await prisma.member.findUniqueOrThrow({ where: { id: result.member.id } })
      expect(member.squareCustomerId).toBeNull()
    } finally {
      ;(await import('../helpers/squareMock')).squareClient.customers.create = original
    }
  })
})

describe('member lifecycle transitions', () => {
  it('pause → reactivate round-trips cleanly', async () => {
    const plan = await createPlan()
    const member = await createMember(plan.id)

    await pauseMember(member.id, '2099-Q2', 'travelling')
    let updated = await prisma.member.findUniqueOrThrow({ where: { id: member.id } })
    expect(updated.status).toBe('PAUSED')
    expect(updated.pausedUntilQuarter).toBe('2099-Q2')
    expect(updated.pausedAt).not.toBeNull()

    await reactivateMember(member.id)
    updated = await prisma.member.findUniqueOrThrow({ where: { id: member.id } })
    expect(updated.status).toBe('ACTIVE')
    expect(updated.pausedUntilQuarter).toBeNull()
    expect(updated.pausedAt).toBeNull()
  })

  it('cancel records the reason and timestamp', async () => {
    const plan = await createPlan()
    const member = await createMember(plan.id)

    await cancelMember(member.id, 'moved away')
    const updated = await prisma.member.findUniqueOrThrow({ where: { id: member.id } })
    expect(updated.status).toBe('CANCELLED')
    expect(updated.cancellationReason).toBe('moved away')
    expect(updated.cancelledAt).not.toBeNull()
  })
})
