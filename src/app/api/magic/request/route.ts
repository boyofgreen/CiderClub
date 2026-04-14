import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOpaqueToken } from '@/lib/tokens'
import { sendEmail, buildMagicLinkEmail } from '@/services/email/sender'
import { appUrl } from '@/lib/resend'
import { addDays } from 'date-fns'

export async function POST(req: Request) {
  const { email } = await req.json()

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const member = await prisma.member.findUnique({
    where: { email: email.toLowerCase().trim() },
  })

  // Always return success to prevent email enumeration
  if (!member || member.status === 'CANCELLED') {
    return NextResponse.json({ ok: true })
  }

  // Create or reuse a valid GENERAL token
  let token = await prisma.memberToken.findFirst({
    where: {
      memberId: member.id,
      type: 'GENERAL',
      expiresAt: { gt: new Date() },
    },
  })

  if (!token) {
    token = await prisma.memberToken.create({
      data: {
        memberId: member.id,
        token: generateOpaqueToken(),
        type: 'GENERAL',
        expiresAt: addDays(new Date(), 90),
      },
    })
  }

  const portalUrl = `${appUrl}/magic?t=${token.token}`

  await sendEmail({
    to: member.email,
    subject: 'Your CiderClub access link',
    html: buildMagicLinkEmail({
      firstName: member.firstName,
      portalUrl,
      reason: "You requested a new link to access your member portal:",
    }),
    type: 'MAGIC_LINK',
    memberId: member.id,
  })

  return NextResponse.json({ ok: true })
}
