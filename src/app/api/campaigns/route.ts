import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ campaigns })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { subject, bodyHtml, bodyText, recipientFilter, scheduledAt } = body

  if (!subject || !bodyHtml) {
    return NextResponse.json({ error: 'subject and bodyHtml are required' }, { status: 400 })
  }

  const campaign = await prisma.campaign.create({
    data: {
      subject,
      bodyHtml,
      bodyText,
      recipientFilter: recipientFilter ? JSON.stringify(recipientFilter) : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: 'DRAFT',
    },
  })
  return NextResponse.json({ campaign }, { status: 201 })
}
