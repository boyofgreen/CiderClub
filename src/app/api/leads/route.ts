import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/leads — capture a partial signup from the /register flow.
// Public and fire-and-forget from the client: called when the visitor
// completes the contact step so we can follow up if they never finish.
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const clean = (v: unknown, max = 100) =>
    typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null

  const firstName = clean(body.firstName)
  const lastName = clean(body.lastName)
  const phone = clean(body.phone, 30)
  const planId = clean(body.planId, 40)

  // Already a member? Nothing to capture.
  const existingMember = await prisma.member.findFirst({ where: { email } })
  if (existingMember) return NextResponse.json({ ok: true })

  const existingLead = await prisma.lead.findFirst({ where: { email } })
  if (existingLead) {
    // Refresh contact details on repeat visits, but never resurrect a
    // dismissed/converted lead back to NEW.
    await prisma.lead.update({
      where: { id: existingLead.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phone && { phone }),
        ...(planId && { planId }),
      },
    })
  } else {
    await prisma.lead.create({ data: { email, firstName, lastName, phone, planId } })
  }

  return NextResponse.json({ ok: true })
}
