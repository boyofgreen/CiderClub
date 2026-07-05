import { NextResponse } from 'next/server'
import { getAppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/services/email/sender'
import { baseTemplate } from '@/lib/emailTemplates'
import { getAdminNotifyEmail } from '@/lib/settings'

// POST /api/members/me/change-plan — switch the member's own plan.
// Takes effect at the next quarterly order generation; nothing already
// billed or generated is changed.
export async function POST(req: Request) {
  const session = await getAppSession()
  if (!session?.memberId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const planId = typeof body.planId === 'string' ? body.planId : ''
  if (!planId) return NextResponse.json({ error: 'planId is required' }, { status: 400 })

  const member = await prisma.member.findUniqueOrThrow({
    where: { id: session.memberId },
    include: { plan: true },
  })

  if (member.status !== 'ACTIVE') {
    return NextResponse.json(
      { error: 'Plan changes are only available for active memberships. Contact us for help.' },
      { status: 409 }
    )
  }

  if (planId === member.planId) {
    return NextResponse.json({ error: 'You are already on this plan.' }, { status: 409 })
  }

  const newPlan = await prisma.plan.findUnique({ where: { id: planId } })
  if (!newPlan || !newPlan.isActive) {
    return NextResponse.json({ error: 'That plan is not available.' }, { status: 404 })
  }

  // Capacity check
  if (newPlan.maxCapacity != null) {
    const activeCount = await prisma.member.count({
      where: { planId: newPlan.id, status: 'ACTIVE' },
    })
    if (activeCount >= newPlan.maxCapacity) {
      return NextResponse.json(
        { error: `${newPlan.name} is currently full. Contact us to join the waitlist.` },
        { status: 409 }
      )
    }
  }

  const oldPlanName = member.plan.name
  const updated = await prisma.member.update({
    where: { id: member.id },
    data: { planId: newPlan.id },
    include: { plan: true },
  })

  // Let the owner know (best-effort — never block the switch on email)
  try {
    const notifyTo = await getAdminNotifyEmail()
    if (notifyTo) {
      await sendEmail({
        to: notifyTo,
        subject: `Plan change: ${member.firstName} ${member.lastName} → ${newPlan.name}`,
        html: baseTemplate(`
          <h2>Member changed plans</h2>
          <p><strong>${member.firstName} ${member.lastName}</strong> (${member.email}) switched
          from <strong>${oldPlanName}</strong> to <strong>${newPlan.name}</strong>.</p>
          <p>The new plan applies starting with the next quarterly order.</p>
        `),
        type: 'ADMIN_PLAN_CHANGE',
        memberId: member.id,
      })
    }
  } catch (err) {
    console.error('[change-plan] admin notification failed:', err)
  }

  return NextResponse.json({ member: updated })
}
