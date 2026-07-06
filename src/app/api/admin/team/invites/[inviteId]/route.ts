import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revokeInvite } from '@/services/orgInvites'

// DELETE /api/admin/team/invites/[inviteId] — revoke a pending invite
export async function DELETE(
  _req: Request,
  { params }: { params: { inviteId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  await revokeInvite(params.inviteId)
  return NextResponse.json({ ok: true })
}
