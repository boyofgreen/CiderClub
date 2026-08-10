import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatDate, formatCents } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import { ImportFromSquare } from './ImportFromSquare'

export const metadata: Metadata = { title: 'Members' }

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: { status?: string; search?: string; page?: string }
}) {
  const page = parseInt(searchParams.page ?? '1')
  const pageSize = 25
  const status = searchParams.status
  const search = searchParams.search

  // Case-insensitive search; each word must match a name or email so
  // "jason smi" finds Jason Smith.
  const terms = (search ?? '').trim().split(/\s+/).filter(Boolean)
  const where = {
    ...(status ? { status } : {}),
    ...(terms.length
      ? {
          AND: terms.map((term) => ({
            OR: [
              { firstName: { contains: term, mode: 'insensitive' as const } },
              { lastName: { contains: term, mode: 'insensitive' as const } },
              { email: { contains: term, mode: 'insensitive' as const } },
            ],
          })),
        }
      : {}),
  }

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      include: { plan: true, orders: { take: 1, orderBy: { createdAt: 'desc' } } },
      orderBy: { joinedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.member.count({ where }),
  ])

  const totalPages = Math.ceil(total / pageSize)
  const statuses = ['ACTIVE', 'PAUSED', 'CANCELLED', 'WAITLIST']

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)' }}>
          Members
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-stone-500">{total} member{total !== 1 ? 's' : ''}</span>
          <ImportFromSquare />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/members"
          className={`px-3 py-1.5 text-xs font-medium border transition ${
            !status ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300 text-stone-600 hover:bg-stone-50'
          }`}
        >
          All
        </Link>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/admin/members?status=${s}${search ? `&search=${search}` : ''}`}
            className={`px-3 py-1.5 text-xs font-medium border transition ${
              status === s ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </Link>
        ))}
      </div>

      {/* Search */}
      <form method="GET" action="/admin/members">
        {status && <input type="hidden" name="status" value={status} />}
        <div className="flex gap-2">
          <input name="search" defaultValue={search} placeholder="Search by name or email…" className="input max-w-sm" />
          <button type="submit" className="btn-secondary">Search</button>
          {search && (
            <Link href={`/admin/members${status ? `?status=${status}` : ''}`} className="btn-secondary">Clear</Link>
          )}
        </div>
      </form>

      {/* Table */}
      <div className="border bg-cream-paper shadow-sm overflow-hidden" style={{ borderColor: 'var(--rule)' }}>
        <div className="divide-y divide-stone-100">
          {members.length === 0 ? (
            <div className="py-12 text-center text-stone-500">No members found.</div>
          ) : (
            members.map((member) => (
              <Link
                key={member.id}
                href={`/admin/members/${member.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-cream-deep transition"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: 'var(--cream-deep)', color: 'var(--terracotta)' }}
                    >
                      {member.firstName[0]}{member.lastName[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900 truncate">{member.firstName} {member.lastName}</p>
                      <p className="text-xs text-stone-500 truncate">{member.email}</p>
                    </div>
                  </div>
                </div>
                <div className="ml-4 flex shrink-0 items-center gap-4">
                  <div className="hidden sm:block text-right">
                    <p className="text-xs text-stone-500">{member.plan.name}</p>
                    <p className="text-xs text-stone-400">{formatCents(member.plan.priceInCents)}/qtr</p>
                  </div>
                  <StatusBadge status={member.status} />
                  <span className="hidden md:block text-xs text-stone-400">{formatDate(member.joinedAt)}</span>
                  <ChevronRight className="h-4 w-4 text-stone-400" />
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">Page {page} of {totalPages} ({total} total)</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={`/admin/members?page=${page - 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`} className="btn-secondary py-1.5 px-3">
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link href={`/admin/members?page=${page + 1}${status ? `&status=${status}` : ''}${search ? `&search=${search}` : ''}`} className="btn-secondary py-1.5 px-3">
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
