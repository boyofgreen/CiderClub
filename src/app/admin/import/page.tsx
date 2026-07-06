import { prisma } from '@/lib/prisma'
import { ImportForm } from './ImportForm'

export const metadata = { title: 'Import Members' }
export const dynamic = 'force-dynamic'

export default async function ImportMembersPage() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
    select: { id: true, name: true },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Import Members</h1>
        <p className="mt-1 text-sm text-stone-600">
          Bring in an existing roster from a spreadsheet or another platform. Upload a CSV
          with an <code className="text-xs bg-stone-100 px-1 rounded">email</code> column —
          name, phone, address, plan, status, join date, and notes columns are picked up
          automatically. Imported members don&apos;t receive any emails.
        </p>
      </div>
      <ImportForm plans={plans} />
    </div>
  )
}
