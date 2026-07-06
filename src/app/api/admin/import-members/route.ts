import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { importMembersFromCsv } from '@/services/memberImport'

const importSchema = z.object({
  csv: z.string().min(1, 'CSV content is required').max(5_000_000, 'File is too large (5 MB max)'),
  defaultPlanId: z.string().optional(),
  dryRun: z.boolean().optional(),
})

// POST /api/admin/import-members — CSV roster import (dryRun for preview)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = importSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const result = await importMembersFromCsv(parsed.data)
  return NextResponse.json(result)
}
