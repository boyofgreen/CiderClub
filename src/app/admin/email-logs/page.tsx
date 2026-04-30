import { prisma } from '@/lib/prisma'
import { formatDateTime } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Email Logs' }

export default async function EmailLogsPage({
  searchParams,
}: {
  searchParams: { type?: string; page?: string }
}) {
  const page = parseInt(searchParams.page ?? '1')
  const pageSize = 50
  const type = searchParams.type
  const where = type ? { type } : {}

  const [logs, total] = await Promise.all([
    prisma.emailLog.findMany({
      where,
      include: { member: { select: { id: true, firstName: true, lastName: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.emailLog.count({ where }),
  ])

  const types = ['WELCOME', 'ORDER_READY', 'ORDER_REMINDER', 'RECEIPT', 'PAYMENT_FAILED',
    'PICKUP_REMINDER', 'MAGIC_LINK', 'CAMPAIGN', 'CUSTOMIZATION_CLOSING']

  const problemCount = await prisma.emailLog.count({
    where: { status: { in: ['BOUNCED', 'COMPLAINED', 'FAILED'] } },
  })

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-6">
      <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)' }}>
        Email Logs
      </h1>

      {problemCount > 0 && (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 px-4 py-3">
          <span className="text-sm text-orange-700">
            <strong>{problemCount} emails</strong> have delivery problems (bounced, spam complaint, or failed to send).
          </span>
        </div>
      )}

      {/* Type filter */}
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/email-logs" className={`px-3 py-1.5 text-xs font-medium border transition ${!type ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300 text-stone-600 hover:bg-stone-50'}`}>
          All
        </Link>
        {types.map((t) => (
          <Link key={t} href={`/admin/email-logs?type=${t}`} className={`px-3 py-1.5 text-xs font-medium border transition ${type === t ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-300 text-stone-600 hover:bg-stone-50'}`}>
            {t.replace(/_/g, ' ')}
          </Link>
        ))}
      </div>

      <div className="border bg-cream-paper shadow-sm overflow-hidden" style={{ borderColor: 'var(--rule)' }}>
        <div className="px-6 py-3 border-b border-stone-100 text-xs text-stone-500">{total} emails</div>
        <div className="divide-y divide-stone-100">
          {logs.map((log) => (
            <div key={log.id} className="flex items-center justify-between px-6 py-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-stone-800 truncate">{log.subject}</p>
                  <span className="shrink-0 bg-stone-100 px-2 py-0.5 text-xs text-stone-500">{log.type}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-xs text-stone-400 truncate">{log.toEmail}</p>
                  {log.member && (
                    <Link href={`/admin/members/${log.member.id}`} className="text-xs text-terracotta hover:text-terracotta-deep shrink-0">
                      {log.member.firstName} {log.member.lastName}
                    </Link>
                  )}
                </div>
              </div>
              <div className="ml-4 flex shrink-0 items-center gap-3">
                <StatusBadge status={log.status} />
                <span className="text-xs text-stone-400">{formatDateTime(log.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            {page > 1 && <Link href={`/admin/email-logs?page=${page - 1}${type ? `&type=${type}` : ''}`} className="btn-secondary py-1.5 px-3">Previous</Link>}
            {page < totalPages && <Link href={`/admin/email-logs?page=${page + 1}${type ? `&type=${type}` : ''}`} className="btn-secondary py-1.5 px-3">Next</Link>}
          </div>
        </div>
      )}
    </div>
  )
}
