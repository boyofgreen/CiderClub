import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { acceptInvite } from '@/services/orgInvites'
import { portalUrlFor } from '@/lib/tenantUrls'

export const metadata = { title: 'Team Invitation' }
export const dynamic = 'force-dynamic'

const FAILURE_COPY: Record<string, { title: string; body: string }> = {
  not_found: {
    title: 'Invitation not found',
    body: 'This invitation may have been revoked or already used. Ask your team to send a new one.',
  },
  expired: {
    title: 'Invitation expired',
    body: 'This invitation has expired. Ask your team to send a fresh one.',
  },
  email_mismatch: {
    title: 'Wrong account',
    body: 'This invitation was sent to a different email address. Sign out, then sign back in with the email the invitation was sent to.',
  },
}

export default async function InvitePage({ params }: { params: { token: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id || !session.user.email) {
    redirect(`/login?callbackUrl=/invite/${params.token}`)
  }

  const result = await acceptInvite({
    token: params.token,
    userId: session.user.id,
    userEmail: session.user.email,
  })

  if (result.ok) {
    redirect(`${portalUrlFor(result.orgSlug)}/admin/dashboard`)
  }

  const copy = FAILURE_COPY[result.reason]
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl border border-stone-200 shadow-sm p-8 text-center space-y-3">
        <h1 className="text-xl font-bold text-stone-900">{copy.title}</h1>
        <p className="text-sm text-stone-600">{copy.body}</p>
      </div>
    </main>
  )
}
