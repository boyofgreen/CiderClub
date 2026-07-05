import { notFound } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatCents, formatDate, formatDateTime } from '@/lib/utils'
import { StatusBadge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, Mail, Phone, MapPin, ExternalLink, ShoppingBag } from 'lucide-react'
import { MemberActions } from './MemberActions'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Member Detail' }

export default async function MemberDetailPage({
  params,
}: {
  params: { memberId: string }
}) {
  const [member, plans] = await Promise.all([
    prisma.member.findUnique({
      where: { id: params.memberId },
      include: {
        plan: true,
        orders: {
          include: { quarter: true },
          orderBy: { createdAt: 'desc' },
        },
        emailLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        referredBy: { select: { id: true, firstName: true, lastName: true } },
        referrals: { select: { id: true, firstName: true, lastName: true, status: true } },
      },
    }),
    prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, name: true, packsPerOrder: true },
    }),
  ])

  if (!member) notFound()

  const totalBilled = member.orders
    .filter((o) => o.status === 'BILLED')
    .reduce((sum, o) => sum + o.totalInCents, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/admin/members" className="mt-1 text-stone-500 hover:text-stone-700">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold text-terracotta" style={{ backgroundColor: 'var(--cream-deep)' }}>
              {member.firstName[0]}{member.lastName[0]}
            </div>
            <div>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(20px,3vw,28px)', color: 'var(--ink)' }}>
                {member.firstName} {member.lastName}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <StatusBadge status={member.status} />
                <span className="text-sm text-stone-500">{member.plan.name}</span>
              </div>
            </div>
          </div>
        </div>
        <MemberActions memberId={member.id} status={member.status} squareCustomerId={member.squareCustomerId} hasCard={!!member.squareCardId} currentPlanId={member.planId} plans={plans} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left col — contact info */}
        <div className="space-y-4">
          <Card>
            <h2 className="font-semibold text-stone-900 mb-3">Contact</h2>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-stone-600">
                <Mail className="h-4 w-4 text-stone-400" />
                <a href={`mailto:${member.email}`} className="hover:text-terracotta break-all">
                  {member.email}
                </a>
              </div>
              {member.phone && (
                <div className="flex items-center gap-2 text-stone-600">
                  <Phone className="h-4 w-4 text-stone-400" />
                  {member.phone}
                </div>
              )}
              {member.address1 && (
                <div className="flex items-start gap-2 text-stone-600">
                  <MapPin className="h-4 w-4 text-stone-400 mt-0.5 shrink-0" />
                  <span>
                    {member.address1}
                    {member.city && `, ${member.city}`}
                    {member.state && `, ${member.state}`}
                    {member.zip && ` ${member.zip}`}
                  </span>
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h2 className="font-semibold text-stone-900 mb-3">Membership</h2>
            <div className="space-y-2 text-sm">
              {[
                ['Plan', member.plan.name],
                ['Price', `${formatCents(member.plan.priceInCents)}/qtr`],
                ['Joined', formatDate(member.joinedAt)],
                ['Total Billed', formatCents(totalBilled)],
                ['Orders', member.orders.length.toString()],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-stone-500">{label}</span>
                  <span className="font-medium text-stone-800">{value}</span>
                </div>
              ))}
              {member.pausedUntilQuarter && (
                <div className="flex justify-between">
                  <span className="text-stone-500">Paused until</span>
                  <span className="font-medium text-yellow-700">{member.pausedUntilQuarter}</span>
                </div>
              )}
            </div>
          </Card>

          {member.squareCustomerId && (
            <Card>
              <h2 className="font-semibold text-stone-900 mb-2">Square</h2>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-500 font-mono text-xs truncate max-w-[140px]">
                  {member.squareCustomerId}
                </span>
                <a
                  href={`https://squareup.com/dashboard/customers/${member.squareCustomerId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-terracotta hover:text-terracotta-deep"
                >
                  View <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </Card>
          )}

          {member.referredBy && (
            <Card>
              <h2 className="font-semibold text-stone-900 mb-2">Referred By</h2>
              <Link
                href={`/admin/members/${member.referredBy.id}`}
                className="text-sm text-terracotta hover:text-terracotta-deep"
              >
                {member.referredBy.firstName} {member.referredBy.lastName}
              </Link>
            </Card>
          )}
        </div>

        {/* Right col — orders, emails, notes */}
        <div className="lg:col-span-2 space-y-4">
          {/* Notes */}
          <NotesEditor memberId={member.id} initialNotes={member.notes ?? ''} />

          {/* Orders */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <ShoppingBag className="h-4 w-4 text-stone-500" />
              <h2 className="font-semibold text-stone-900">Orders ({member.orders.length})</h2>
            </div>
            {member.orders.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">No orders yet</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {member.orders.map((order) => (
                  <Link
                    key={order.id}
                    href={`/admin/orders/${order.id}`}
                    className="flex items-center justify-between py-2.5 hover:text-terracotta transition"
                  >
                    <span className="text-sm font-medium text-stone-700">{order.quarter?.label ?? 'Ad Hoc'}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-stone-500">{formatCents(order.totalInCents)}</span>
                      <StatusBadge status={order.status} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Email history */}
          <Card>
            <h2 className="font-semibold text-stone-900 mb-4">Email History</h2>
            {member.emailLogs.length === 0 ? (
              <p className="text-sm text-stone-400 py-4 text-center">No emails sent</p>
            ) : (
              <div className="divide-y divide-stone-100">
                {member.emailLogs.map((log) => (
                  <div key={log.id} className="py-2.5">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-stone-700">{log.subject}</p>
                      <StatusBadge status={log.status} />
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {log.type} · {formatDateTime(log.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

// Inline client component for notes auto-save
import { NotesEditor } from './NotesEditor'
