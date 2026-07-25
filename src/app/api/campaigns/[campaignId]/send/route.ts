import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/services/email/sender'
import { interpolate, baseTemplate } from '@/lib/emailTemplates'

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

  // Parse recipient filter or default to all active members. The stored value
  // has appeared in several shapes over time — double-stringified JSON from the
  // original create form, a single status string from the draft editor, or a
  // status array — so normalize all of them here.
  let statusFilter: string[] = ['ACTIVE']
  if (campaign.recipientFilter) {
    try {
      let parsed: unknown = JSON.parse(campaign.recipientFilter)
      if (typeof parsed === 'string') parsed = JSON.parse(parsed) // legacy double-encoding
      const status = (parsed as { status?: unknown } | null)?.status
      if (Array.isArray(status)) {
        const clean = status.filter((s): s is string => typeof s === 'string')
        if (clean.length) statusFilter = clean
      } else if (typeof status === 'string' && status) {
        statusFilter = [status]
      }
    } catch {
      // ignore malformed filter, default to ACTIVE
    }
  }
  if (statusFilter.includes('ALL')) {
    statusFilter = ['ACTIVE', 'PAUSED', 'CANCELLED', 'WAITLIST']
  }

  try {
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
          html: baseTemplate(interpolate(campaign.bodyHtml, vars)),
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
  } catch (err) {
    console.error('[campaign-send] Failed:', err)
    const message = err instanceof Error ? err.message : 'Send failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
