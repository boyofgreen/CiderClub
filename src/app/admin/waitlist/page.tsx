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
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)' }}>
          Waitlist
        </h1>
        <span className="text-sm text-stone-500">{entries.length} total</span>
      </div>

      {entries.length === 0 ? (
        <div className="border border-dashed p-12 text-center" style={{ borderColor: 'var(--rule-strong)' }}>
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
                <div key={entry.id} className="flex items-center justify-between px-4 py-3" style={{ backgroundColor: 'var(--cream-deep)' }}>
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-7 w-7 items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: 'var(--paper)', color: 'var(--terracotta)', border: '1px solid var(--rule)' }}
                    >
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
                      <Link href={`/admin/members/${entry.member.id}`} className="text-xs text-terracotta hover:text-terracotta-deep">
                        View member
                      </Link>
                    )}
                    {entry.notifiedAt && <span className="text-xs text-green-600">Notified</span>}
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
