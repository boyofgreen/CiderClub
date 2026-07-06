import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AdminSidebar, type OrgSwitcherProps } from '@/components/nav/AdminSidebar'
import { resolveRequestOrgSlug } from '@/lib/tenantRequest'
import { DEFAULT_ORG_SLUG } from '@/lib/tenantHost'
import { portalUrlFor } from '@/lib/tenantUrls'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/login')
  }

  // Org switcher data: which org is this host, and where else can they go?
  const currentSlug = (await resolveRequestOrgSlug().catch(() => null)) ?? DEFAULT_ORG_SLUG
  const currentOrg = await prisma.organization.findUnique({
    where: { slug: currentSlug },
    select: { name: true },
  })
  const memberships = session.user.memberships ?? []
  const otherOrgs = memberships.filter((m) => m.slug !== currentSlug)
  const otherOrgNames =
    otherOrgs.length > 0
      ? await prisma.organization.findMany({
          where: { slug: { in: otherOrgs.map((m) => m.slug) } },
          select: { name: true, slug: true },
        })
      : []

  const orgSwitcher: OrgSwitcherProps = {
    currentName: currentOrg?.name ?? currentSlug,
    options: otherOrgNames.map((o) => ({
      name: o.name,
      url: `${portalUrlFor(o.slug)}/admin/dashboard`,
    })),
    platformConsoleUrl: session.user.isSuperAdmin ? '/platform/orgs' : undefined,
  }

  return (
    <div className="flex h-screen overflow-hidden bg-cream-paper">
      <AdminSidebar orgSwitcher={orgSwitcher} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
      </main>
    </div>
  )
}
