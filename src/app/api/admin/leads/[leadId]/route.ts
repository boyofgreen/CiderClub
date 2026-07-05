import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const VALID_STATUSES = ['NEW', 'FOLLOWED_UP', 'CONVERTED', 'DISMISSED']

// PATCH /api/admin/leads/[leadId] — update status and/or notes
export async function PATCH(
  req: Request,
  { params }: { params: { leadId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const data: Record<string, unknown> = {}

  if (typeof body.status === 'string') {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    data.status = body.status
    data.followedUpAt = body.status === 'FOLLOWED_UP' ? new Date() : undefined
    if (body.status === 'NEW') data.followedUpAt = null
  }
  if (typeof body.notes === 'string') {
    data.notes = body.notes.trim() || null
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const lead = await prisma.lead.update({ where: { id: params.leadId }, data })
  return NextResponse.json({ lead })
}

// DELETE /api/admin/leads/[leadId] — remove a lead entirely
export async function DELETE(
  _req: Request,
  { params }: { params: { leadId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.lead.delete({ where: { id: params.leadId } })
  return NextResponse.json({ ok: true })
}
