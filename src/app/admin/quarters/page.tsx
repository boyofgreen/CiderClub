import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { Calendar, Plus, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Quarters' }

export default async function AdminQuartersPage() {
  const quarters = await prisma.quarter.findMany({
    include: {
      _count: { select: { orders: true, products: true, pickupEvents: true } },
    },
    orderBy: [{ year: 'desc' }, { quarter: 'desc' }],
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-stone-900">Quarters</h1>
        <Link href="/admin/quarters/new" className="btn-primary text-sm">
          <Plus className="h-4 w-4" /> New Quarter
        </Link>
      </div>

      {quarters.length === 0 ? (
        <div className="rounded-xl border border-dashed border-stone-300 p-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-stone-300 mb-3" />
          <p className="font-medium text-stone-500">No quarters yet</p>
          <Link href="/admin/quarters/new" className="mt-3 inline-block text-sm text-brand-600 hover:text-brand-700">
            Create your first quarter →
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          <div className="divide-y divide-stone-100">
            {quarters.map((q) => (
              <Link
                key={q.id}
                href={`/admin/quarters/${q.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-stone-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                    <Calendar className="h-5 w-5 text-brand-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-stone-900">{q.label}</span>
                      {q.name && <span className="text-sm text-stone-500">— {q.name}</span>}
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      Customization: {formatDate(q.startsAt)} – {formatDate(q.endsAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex gap-3 text-xs text-stone-500">
                    <span>{q._count.orders} orders</span>
                    <span>{q._count.products} products</span>
                    <span>{q._count.pickupEvents} pickups</span>
                  </div>
                  <StatusBadge status={q.status} />
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
