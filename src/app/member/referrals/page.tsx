import { redirect } from 'next/navigation'
import { getAppSession } from '@/lib/session'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { Gift, Users } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Referrals' }

export default async function MemberReferralsPage() {
  const session = await getAppSession()
  if (!session?.memberId) redirect('/login')

  const member = await prisma.member.findUnique({
    where: { id: session.memberId },
    include: {
      referrals: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
          joinedAt: true,
          plan: { select: { name: true } },
        },
      },
    },
  })

  if (!member) redirect('/login')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const referralLink = `${appUrl}/register?ref=${member.referralCode}`

  return (
    <div className="max-w-2xl space-y-6">
      <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)' }}>
        Referrals
      </h1>

      <Card>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center" style={{ backgroundColor: 'var(--cream-deep)' }}>
            <Gift className="h-6 w-6 text-terracotta" />
          </div>
          <div className="flex-1">
            <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 600, fontSize: 18, color: 'var(--ink)' }}>
              Share the love
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Share your personal link with friends. When they join, they'll be linked to you.
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label className="label-saloon">Your referral link</label>
          <div className="flex gap-2 mt-1.5">
            <input
              readOnly
              value={referralLink}
              className="field-saloon flex-1 text-xs"
            />
            <button
              className="btn-saloon flex items-center gap-1.5"
              style={{ fontSize: 10, padding: '12px 16px', whiteSpace: 'nowrap' }}
              data-copy={referralLink}
            >
              Copy
            </button>
          </div>
          <p className="mt-1.5 text-xs text-stone-400">
            Copy this link and share it with friends who might want to join.
          </p>
        </div>
      </Card>

      {/* People they referred */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4" style={{ color: 'var(--ink-soft)' }} />
          <h2 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 600, fontSize: 18, color: 'var(--ink)' }}>
            Friends You've Referred ({member.referrals.length})
          </h2>
        </div>

        {member.referrals.length === 0 ? (
          <div className="py-6 text-center text-stone-400">
            <Users className="mx-auto h-8 w-8 mb-2 opacity-40" />
            <p className="text-sm">No referrals yet. Share your link above!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {member.referrals.map((ref) => (
              <div
                key={ref.id}
                className="flex items-center justify-between px-4 py-3"
                style={{ backgroundColor: 'var(--cream-deep)' }}
              >
                <div>
                  <span className="font-medium text-stone-800">
                    {ref.firstName} {ref.lastName}
                  </span>
                  <span className="ml-2 text-sm text-stone-500">{ref.plan.name}</span>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2 py-0.5 ${
                    ref.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                    ref.status === 'PAUSED' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-stone-100 text-stone-500'
                  }`}>{ref.status}</span>
                  <p className="text-xs text-stone-400 mt-0.5">Joined {formatDate(ref.joinedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
