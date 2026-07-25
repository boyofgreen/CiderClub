import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { markdownToHtml } from '@/lib/markdown'

export async function GET(
  _req: Request,
  { params }: { params: { campaignId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: params.campaignId },
  })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ campaign })
}

export async function PATCH(
  req: Request,
  { params }: { params: { campaignId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const allowed = ['subject', 'bodyMarkdown', 'bodyHtml', 'bodyText', 'recipientFilter', 'scheduledAt']
  const raw = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const campaign = await prisma.campaign.findUnique({ where: { id: params.campaignId } })
  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (campaign.status === 'SENT') {
    return NextResponse.json({ error: 'Cannot edit a sent campaign' }, { status: 409 })
  }

  const data: Record<string, unknown> = { ...raw }
  // Markdown is the source of truth — re-render bodyHtml whenever it changes.
  if (typeof raw.bodyMarkdown === 'string') {
    data.bodyHtml = markdownToHtml(raw.bodyMarkdown)
  }
  if (raw.recipientFilter !== undefined) {
    data.recipientFilter = raw.recipientFilter ? JSON.stringify(raw.recipientFilter) : null
  }
  if (raw.scheduledAt !== undefined) {
    data.scheduledAt = raw.scheduledAt ? new Date(raw.scheduledAt as string) : null
  }

  const updated = await prisma.campaign.update({ where: { id: params.campaignId }, data })
  return NextResponse.json({ campaign: updated })
}

// DELETE — remove a draft. Sent campaigns are kept for the record.
export async function DELETE(
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
    return NextResponse.json({ error: 'Sent campaigns cannot be deleted — they are your send history.' }, { status: 409 })
  }

  await prisma.campaign.delete({ where: { id: params.campaignId } })
  return NextResponse.json({ ok: true })
}
