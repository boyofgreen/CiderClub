import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { removeOperator } from '@/services/orgInvites'

// DELETE /api/admin/team/[orgUserId] — remove an operator from this org
export async function DELETE(
  _req: Request,
  { params }: { params: { orgUserId: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await removeOperator({
      orgUserId: params.orgUserId,
      actingRole: session.user.orgRole ?? '',
      actingIsSuperAdmin: session.user.isSuperAdmin,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to remove team member' },
      { status: 400 }
    )
  }
}
