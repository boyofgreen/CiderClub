import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCents, formatDate } from '@/lib/utils'
import { getLegacyStanding, getLegacyTerms, LEGACY_EXPIRED_REASON } from '@/services/legacy'
import { getLegacyExpiryQuarters } from '@/lib/settings'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Legacy Club' }
export const dynamic = 'force-dynamic'

const OFFER_TYPES = ['LEGACY_ORDER_INVITE', 'LEGACY_EXPIRY_WARNING']

function quarterIdOf(metadata: string | null): string | null {
  try {
    const id = (JSON.parse(metadata ?? '{}') as { quarterId?: unknown }).quarterId
    return typeof id === 'string' ? id : null
  } catch {
    return null
  }
}

const pct = (n: number, of: number) => (of > 0 ? `${Math.round((n / of) * 100)}%` : '—')

export default async function LegacyReportPage() {
  const [members, everMoved, rejoined, expired, offerLogs, legacyOrders, quarters, terms, expiryQuarters] =
    await Promise.all([
      prisma.member.findMany({
        where: { status: 'LEGACY' },
        include: { plan: true },
        orderBy: { legacyAt: 'asc' },
      }),
      // No history table — the emails we send at each transition are the record.
      prisma.emailLog.findMany({ where: { type: 'LEGACY_WELCOME' }, distinct: ['memberId'], select: { memberId: true } }),
      prisma.emailLog.findMany({ where: { type: 'LEGACY_REJOINED' }, distinct: ['memberId'], select: { memberId: true } }),
      prisma.member.count({ where: { status: 'CANCELLED', cancellationReason: { startsWith: LEGACY_EXPIRED_REASON } } }),
      prisma.emailLog.findMany({
        where: { type: { in: OFFER_TYPES }, status: { not: 'FAILED' } },
        select: { memberId: true, metadata: true },
      }),
      // minBottles is only set on orders a legacy member opted in to
      prisma.order.findMany({
        where: { minBottles: { not: null }, status: { not: 'CANCELLED' }, quarterId: { not: null } },
        select: {
          memberId: true,
          quarterId: true,
          status: true,
          totalInCents: true,
          createdAt: true,
          items: { select: { quantity: true } },
        },
      }),
      prisma.quarter.findMany({ orderBy: { startsAt: 'desc' }, take: 12 }),
      getLegacyTerms(),
      getLegacyExpiryQuarters(),
    ])

  const standing = await getLegacyStanding(members)

  // ── Per quarter ──
  const offeredByQuarter = new Map<string, Set<string>>()
  for (const log of offerLogs) {
    const qid = quarterIdOf(log.metadata)
    if (!qid || !log.memberId) continue
    if (!offeredByQuarter.has(qid)) offeredByQuarter.set(qid, new Set())
    offeredByQuarter.get(qid)!.add(log.memberId)
  }
  const quarterRows = quarters
    .map((q) => {
      const orders = legacyOrders.filter((o) => o.quarterId === q.id)
      return {
        id: q.id,
        label: q.label,
        offered: offeredByQuarter.get(q.id)?.size ?? 0,
        ordered: orders.length,
        bottles: orders.reduce((s, o) => s + o.items.reduce((n, i) => n + i.quantity, 0), 0),
        total: orders.reduce((s, o) => s + o.totalInCents, 0),
        billed: orders.filter((o) => o.status === 'BILLED').reduce((s, o) => s + o.totalInCents, 0),
      }
    })
    .filter((r) => r.offered > 0 || r.ordered > 0)

  const totalOffered = quarterRows.reduce((s, r) => s + r.offered, 0)
  const totalOrdered = quarterRows.reduce((s, r) => s + r.ordered, 0)
  const totalRevenue = quarterRows.reduce((s, r) => s + r.total, 0)

  // ── Per member ──
  const memberRows = members.map((m) => {
    const since = m.legacyAt ?? m.updatedAt
    const orders = legacyOrders.filter((o) => o.memberId === m.id && o.createdAt >= since)
    const s = standing.get(m.id)!
    return {
      member: m,
      since,
      orders: orders.length,
      spent: orders.reduce((sum, o) => sum + o.totalInCents, 0),
      ...s,
    }
  })
  const atRisk = memberRows.filter((r) => r.warned).length

  const h1 = { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(22px,3vw,30px)', color: 'var(--ink)' } as const
  const th = 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500'
  const td = 'px-4 py-3 text-sm text-stone-700'

  return (
    <div className="space-y-6">
      <div>
        <h1 style={h1}>Legacy Club</h1>
        <p className="mt-1 text-sm text-stone-500">
          {terms.discountPercent}% off, {terms.minBottles}-bottle minimum.{' '}
          {expiryQuarters > 0
            ? `After ${expiryQuarters} passed-up offers the next invitation is a final notice; skip that and the membership expires.`
            : 'Legacy memberships never expire.'}{' '}
          <Link href="/admin/settings" className="text-terracotta underline">Change in Settings</Link>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Legacy members now" value={members.length} sub={atRisk ? `${atRisk} on final notice` : 'none on final notice'} />
        <Stat label="Offers taken up" value={pct(totalOrdered, totalOffered)} sub={`${totalOrdered} orders from ${totalOffered} invitations`} />
        <Stat label="Legacy order revenue" value={formatCents(totalRevenue)} sub="incl. tax, all quarters" />
        <Stat
          label="Came back to the club"
          value={rejoined.length}
          sub={`of ${everMoved.length} ever moved to legacy · ${expired} expired`}
        />
      </div>

      {/* By quarter */}
      <div className="border bg-cream-paper shadow-sm overflow-x-auto" style={{ borderColor: 'var(--rule)' }}>
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">By quarter</h2>
        </div>
        {quarterRows.length === 0 ? (
          <p className="py-10 text-center text-sm text-stone-400">
            No legacy invitations have gone out yet. They&apos;re sent when you generate a quarter&apos;s orders.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className={th}>Quarter</th>
                <th className={`${th} text-right`}>Invited</th>
                <th className={`${th} text-right`}>Ordered</th>
                <th className={`${th} text-right`}>Take-up</th>
                <th className={`${th} text-right`}>Bottles</th>
                <th className={`${th} text-right`}>Order total</th>
                <th className={`${th} text-right`}>Billed so far</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {quarterRows.map((r) => (
                <tr key={r.id}>
                  <td className={td}>
                    <Link href={`/admin/quarters/${r.id}`} className="font-medium text-stone-900 hover:text-terracotta">{r.label}</Link>
                  </td>
                  <td className={`${td} text-right`}>{r.offered}</td>
                  <td className={`${td} text-right`}>{r.ordered}</td>
                  <td className={`${td} text-right`}>{pct(r.ordered, r.offered)}</td>
                  <td className={`${td} text-right`}>{r.bottles}</td>
                  <td className={`${td} text-right`}>{formatCents(r.total)}</td>
                  <td className={`${td} text-right`}>{formatCents(r.billed)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Members */}
      <div className="border bg-cream-paper shadow-sm overflow-x-auto" style={{ borderColor: 'var(--rule)' }}>
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">Legacy members ({members.length})</h2>
        </div>
        {memberRows.length === 0 ? (
          <p className="py-10 text-center text-sm text-stone-400">
            No legacy members yet. Move someone from their member page: Actions → Move to Legacy Club.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100">
                <th className={th}>Member</th>
                <th className={th}>Was</th>
                <th className={th}>Legacy since</th>
                <th className={`${th} text-right`}>Orders</th>
                <th className={`${th} text-right`}>Spent</th>
                <th className={th}>Last order</th>
                <th className={th}>Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {memberRows.map((r) => (
                <tr key={r.member.id}>
                  <td className={td}>
                    <Link href={`/admin/members/${r.member.id}`} className="font-medium text-stone-900 hover:text-terracotta">
                      {r.member.firstName} {r.member.lastName}
                    </Link>
                    <div className="text-xs text-stone-400">{r.member.email}</div>
                  </td>
                  <td className={td}>{r.member.plan.name}</td>
                  <td className={td}>{formatDate(r.since)}</td>
                  <td className={`${td} text-right`}>{r.orders}</td>
                  <td className={`${td} text-right`}>{formatCents(r.spent)}</td>
                  <td className={td}>{r.lastOrderAt ? formatDate(r.lastOrderAt) : 'Never'}</td>
                  <td className={td}>
                    {r.warned ? (
                      <span className="font-medium text-red-700">Final notice sent</span>
                    ) : r.offersSinceLastOrder === 0 ? (
                      <span className="text-green-700">Up to date</span>
                    ) : (
                      <span className={expiryQuarters > 0 && r.offersSinceLastOrder >= expiryQuarters ? 'text-amber-700 font-medium' : ''}>
                        {r.offersSinceLastOrder}
                        {expiryQuarters > 0 ? ` of ${expiryQuarters}` : ''} offer{r.offersSinceLastOrder === 1 && expiryQuarters === 0 ? '' : 's'} passed
                        {expiryQuarters > 0 && r.offersSinceLastOrder >= expiryQuarters ? ' · final notice next' : ''}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value, sub }: { label: string; value: string | number; sub: string }) {
  return (
    <div className="border bg-cream-paper p-5 shadow-sm" style={{ borderColor: 'var(--rule)' }}>
      <p className="text-xs text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
      <p className="mt-1 text-xs text-stone-400">{sub}</p>
    </div>
  )
}
