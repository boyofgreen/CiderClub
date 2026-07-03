import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/services/email/sender'
import { interpolate } from '@/lib/emailTemplates'

export async function POST(
  _req: Request,
  { params }: { params: { campaignId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const campaign = await prisma.campaign.findUnique({ where: { id: params.campaignId } })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (campaign.status === 'SENT') {
    return NextResponse.json({ error: 'Campaign already sent' }, { status: 409 })
  }

  // Parse recipient filter or default to all active members
  let statusFilter: string[] = ['ACTIVE']
  if (campaign.recipientFilter) {
    try {
      const filter = JSON.parse(campaign.recipientFilter) as { status?: string[] }
      if (filter.status) statusFilter = filter.status
    } catch {
      // ignore malformed filter, default to ACTIVE
    }
  }

  const members = await prisma.member.findMany({
    where: { status: { in: statusFilter } },
    select: { id: true, firstName: true, lastName: true, email: true },
  })

  let sent = 0
  let failed = 0

  for (const member of members) {
    // Personalize {{firstName}} / {{lastName}} / {{email}} placeholders per recipient
    const vars = {
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
    }
    try {
      await sendEmail({
        to: member.email,
        subject: interpolate(campaign.subject, vars),
        html: interpolate(campaign.bodyHtml, vars),
        memberId: member.id,
        type: 'CAMPAIGN',
      })
      sent++
    } catch {
      failed++
    }
  }

  await prisma.campaign.update({
    where: { id: params.campaignId },
    data: { status: 'SENT', sentAt: new Date(), sentCount: sent },
  })

  return NextResponse.json({ ok: true, sent, failed })
}
