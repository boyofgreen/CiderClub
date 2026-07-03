import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { markdownToHtml } from '@/lib/markdown'

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
  const { subject, bodyMarkdown, bodyHtml, bodyText, recipientFilter, scheduledAt } = body

  // Markdown is the source of truth; fall back to raw HTML for older clients.
  const markdown = typeof bodyMarkdown === 'string' ? bodyMarkdown : ''
  const renderedHtml = markdown ? markdownToHtml(markdown) : (bodyHtml ?? '')

  if (!subject || !renderedHtml) {
    return NextResponse.json({ error: 'subject and body are required' }, { status: 400 })
  }

  const campaign = await prisma.campaign.create({
    data: {
      subject,
      bodyMarkdown: markdown || null,
      bodyHtml: renderedHtml,
      bodyText,
      recipientFilter: recipientFilter ? JSON.stringify(recipientFilter) : null,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: 'DRAFT',
    },
  })
  return NextResponse.json({ campaign }, { status: 201 })
}
