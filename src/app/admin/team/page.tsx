import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { listTeam } from '@/services/orgInvites'
import { TeamManager } from './TeamManager'

export const metadata = { title: 'Team' }
export const dynamic = 'force-dynamic'

export default async function TeamPage() {
  const session = await getServerSession(authOptions)
  const { operators, invites } = await listTeam()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Team</h1>
        <p className="mt-1 text-sm text-stone-600">
          Invite people to help run the club. Admins can manage everything; staff is for
          tasting-room helpers who check in pickups. Invitations expire after 14 days.
        </p>
      </div>
      <TeamManager
        initialOperators={operators.map((o) => ({
          id: o.id,
          role: o.role,
          name: o.user.name ?? o.user.email ?? 'Unknown',
          email: o.user.email ?? '',
        }))}
        initialInvites={invites.map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          token: i.token,
          expiresAt: i.expiresAt.toISOString(),
        }))}
        currentUserId={session?.user.id ?? ''}
        currentUserEmail={session?.user.email ?? ''}
      />
    </div>
  )
}
