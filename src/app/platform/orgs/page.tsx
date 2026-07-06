import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { portalUrlFor } from '@/lib/tenantUrls'
import { Badge } from '@/components/ui/Badge'

export const metadata = { title: 'Organizations — Platform Console' }
export const dynamic = 'force-dynamic'

const TIER_COLORS = { FOUNDER: 'purple', TRIAL: 'amber', STARTER: 'blue', GROWTH: 'green', PRO: 'green' } as const

export default async function PlatformOrgsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user.isSuperAdmin) redirect('/')

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true, name: true, slug: true, customDomain: true, planTier: true,
      trialEndsAt: true, createdAt: true, squareMerchantId: true,
      _count: { select: { members: true, users: true } },
    },
  })

  return (
    <main className="min-h-screen bg-stone-50 px-6 py-10">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Organizations</h1>
          <p className="mt-1 text-sm text-stone-600">
            All tenants on the platform. As a superadmin you have admin access on every
            portal — opening one is effectively support impersonation, so tread lightly.
          </p>
        </div>

        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-100 text-xs text-stone-600">
              <tr>
                <th className="px-4 py-3 font-medium">Organization</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Operators</th>
                <th className="px-4 py-3 font-medium">Square</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orgs.map((org) => (
                <tr key={org.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-stone-900">{org.name}</p>
                    <p className="text-xs text-stone-500">
                      {org.slug}
                      {org.customDomain ? ` · ${org.customDomain}` : ''}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge color={TIER_COLORS[org.planTier as keyof typeof TIER_COLORS] ?? 'gray'}>
                      {org.planTier}
                    </Badge>
                    {org.planTier === 'TRIAL' && org.trialEndsAt && (
                      <p className="mt-1 text-xs text-stone-500">
                        ends {org.trialEndsAt.toLocaleDateString()}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">{org._count.members}</td>
                  <td className="px-4 py-3">{org._count.users}</td>
                  <td className="px-4 py-3">
                    {org.squareMerchantId ? (
                      <Badge color="green">connected</Badge>
                    ) : (
                      <Badge color="gray">not connected</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{org.createdAt.toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <a
                      className="text-brand-600 underline text-xs font-medium"
                      href={`${portalUrlFor(org.slug)}/admin/dashboard`}
                    >
                      Open admin
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
