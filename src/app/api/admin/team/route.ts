import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { listTeam, createInvite } from '@/services/orgInvites'

// GET /api/admin/team — operators + pending invites for this org
export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const team = await listTeam()
  return NextResponse.json(team)
}

const inviteSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  role: z.enum(['ADMIN', 'STAFF']),
})

// POST /api/admin/team — invite an operator
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  try {
    const { invite, inviteUrl } = await createInvite({
      email: parsed.data.email,
      role: parsed.data.role,
      invitedById: session.user.id,
      invitedByName: session.user.name ?? undefined,
    })
    return NextResponse.json({
      invite: { id: invite.id, email: invite.email, role: invite.role, expiresAt: invite.expiresAt },
      inviteUrl,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create invite' },
      { status: 400 }
    )
  }
}
