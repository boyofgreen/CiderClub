import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getMemberPortalToken } from '@/services/orders'
import { sendEmail, buildSaveCardEmail } from '@/services/email/sender'
import { appUrl } from '@/lib/resend'

// POST — admin emails a member a magic link to save a card on file
export async function POST(
  _req: Request,
  { params }: { params: { memberId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const member = await prisma.member.findUnique({ where: { id: params.memberId } })
  if (!member) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const token = await getMemberPortalToken(member.id)
  const portalUrl = `${appUrl}/magic?t=${token}&next=/member/profile?card=1`

  await sendEmail({
    to: member.email,
    subject: 'Save Your Card — Hill Country Cider Club',
    html: buildSaveCardEmail({ firstName: member.firstName, portalUrl }),
    type: 'MAGIC_LINK',
    memberId: member.id,
    metadata: { purpose: 'save-card' },
  })

  return NextResponse.json({ ok: true })
}
