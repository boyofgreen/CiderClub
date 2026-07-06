import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncCiderClubProductsFromSquare } from '@/services/square/catalog'
import { config } from '@/lib/config'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!config.square.configured) {
    return NextResponse.json(
      { error: 'SQUARE_ACCESS_TOKEN is not configured' },
      { status: 500 }
    )
  }

  // Backfill any products with null priceInCents (created before the pricing feature).
  // Use raw SQL because priceInCents is non-nullable in the Prisma schema so the
  // typed client rejects null in a where clause.
  await prisma.$executeRaw`UPDATE "Product" SET "priceInCents" = 2100 WHERE "priceInCents" IS NULL`

  try {
    const result = await syncCiderClubProductsFromSquare()
    // Return 200 even if some individual products errored — partial success
    return NextResponse.json(result)
  } catch (err) {
    // Top-level failure (auth error, category not found, network issue)
    const message = err instanceof Error ? err.message : String(err)
    console.error('[sync-from-square] Fatal error:', err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
