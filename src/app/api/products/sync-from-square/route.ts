import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
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

  try {
    const result = await syncCiderClubProductsFromSquare()
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Sync failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
