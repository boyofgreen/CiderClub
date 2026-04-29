import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { syncCiderClubProductsFromSquare } from '@/services/square/catalog'

export async function POST() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!process.env.SQUARE_ACCESS_TOKEN) {
    return NextResponse.json(
      { error: 'SQUARE_ACCESS_TOKEN is not configured' },
      { status: 500 }
    )
  }

  // Backfill any products with null priceInCents (created before the pricing feature)
  await prisma.product.updateMany({
    where: { priceInCents: null as unknown as number },
    data: { priceInCents: 2100 },
  })

  try {
    const result = await syncCiderClubProductsFromSquare()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
