import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { Card } from '@/components/ui/Card'
import { List } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Waitlist' }

export default async function AdminWaitlistPage() {
  const entries = await prisma.waitlistEntry.findMany({
    where: { convertedAt: null },
    include: { plan: true, member: true },
    orderBy: [{ planId: 'asc' }, { position: 'asc' }],
  })

  const byPlan = entries.reduce<Record<string, typeof entries>>((acc, e) => {
    const key = e.plan.name
    if (!acc[key]) acc[key] = []
    acc[key].push(e)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Waitlist</h1>
        <span className="text-sm text-stone-500">{entries.length} total</span>
      </div>

      {entries.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center">
          <List className="mx-auto h-10 w-10 text-stone-300 mb-3" />
          <p className="text-stone-500">No one on the waitlist right now.</p>
        </div>
      ) : (
        Object.entries(byPlan).map(([planName, planEntries]) => (
          <Card key={planName}>
            <h2 className="font-semibold text-stone-900 mb-4">
              {planName} <span className="text-stone-400 font-normal">({planEntries.length})</span>
            </h2>
            <div className="space-y-2">
              {planEntries.map((entry, idx) => (
                <div key={entry.id} className="flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-stone-800">{entry.name ?? entry.email}</p>
                      <p className="text-xs text-stone-400">{entry.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-stone-400">{formatDate(entry.createdAt)}</span>
                    {entry.member && (
                      <Link
                        href={`/admin/members/${entry.member.id}`}
                        className="text-xs text-brand-600 hover:text-brand-700"
                      >
                        View member
                      </Link>
                    )}
                    {entry.notifiedAt && (
                      <span className="text-xs text-green-600">Notified</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))
      )}
    </div>
  )
}
