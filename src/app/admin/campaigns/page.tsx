import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDateTime } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { Megaphone, Plus, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Email Campaigns' }

export default async function AdminCampaignsPage() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(20px,3vw,28px)', color: 'var(--ink)' }}>Email Campaigns</h1>
        <Link href="/admin/campaigns/new" className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center">
          <Megaphone className="mx-auto h-10 w-10 text-stone-300 mb-3" />
          <p className="font-medium text-stone-500">No campaigns yet</p>
          <Link href="/admin/campaigns/new" className="mt-3 inline-block text-sm text-terracotta hover:text-terracotta-deep">
            Create your first campaign →
          </Link>
        </div>
      ) : (
        <div className="border bg-cream-paper shadow-sm overflow-hidden" style={{ borderColor: 'var(--rule)' }}>
          <div className="divide-y divide-stone-100">
            {campaigns.map((c) => (
              <Link
                key={c.id}
                href={`/admin/campaigns/${c.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-cream-deep transition"
              >
                <div>
                  <p className="font-medium text-stone-900">{c.subject}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    {c.sentAt
                      ? `Sent ${formatDateTime(c.sentAt)} · ${c.sentCount} recipients`
                      : `Created ${formatDateTime(c.createdAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={c.status} />
                  <ChevronRight className="h-4 w-4 text-stone-400" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
