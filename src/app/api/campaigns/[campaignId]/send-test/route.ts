import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/services/email/sender'
import { interpolate, baseTemplate } from '@/lib/emailTemplates'

// POST /api/campaigns/[campaignId]/send-test — send a single preview copy to
// one address. Does not touch the campaign's status or sent count.
export async function POST(
  req: Request,
  { params }: { params: { campaignId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'A valid email address is required' }, { status: 400 })
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: params.campaignId } })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // If the address belongs to a member, personalize with their real details so
  // the test reads exactly like the live send; otherwise use sample values.
  const member = await prisma.member.findUnique({ where: { email } })
  const vars = member
    ? { firstName: member.firstName, lastName: member.lastName, email: member.email }
    : { firstName: 'Jane', lastName: 'Doe', email }

  try {
    await sendEmail({
      to: email,
      subject: `[Test] ${interpolate(campaign.subject, vars)}`,
      html: baseTemplate(interpolate(campaign.bodyHtml, vars)),
      type: 'CAMPAIGN_TEST',
      memberId: member?.id,
      metadata: { campaignId: campaign.id },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[campaign-test-send] Failed:', err)
    return NextResponse.json({ error: 'Test send failed — check the email logs.' }, { status: 500 })
  }
}
