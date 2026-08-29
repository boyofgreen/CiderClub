import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TRACKED_PATHS } from '@/lib/siteInfo'

const ALLOWED_PATHS = new Set<string>(TRACKED_PATHS)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const path = typeof body.path === 'string' ? body.path : null
    const referrer = typeof body.referrer === 'string' && body.referrer ? body.referrer.slice(0, 500) : null

    if (!path || !ALLOWED_PATHS.has(path)) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    await prisma.pageView.create({ data: { path, referrer } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
