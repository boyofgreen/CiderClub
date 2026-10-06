import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { importFromUrl, ImportError } from '@/services/eventImport'

// POST /api/admin/events/import-link — read a ticketing page (TicketsCandy,
// Eventbrite, ...) and return a draft for the admin to review. Saves nothing.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { url } = await req.json().catch(() => ({}))
  if (typeof url !== 'string' || !url.trim()) {
    return NextResponse.json({ error: 'Paste a ticket page link.' }, { status: 400 })
  }

  try {
    const draft = await importFromUrl(url)
    const existing = await prisma.clubEvent.findUnique({
      where: { sourceUrl: draft.sourceUrl },
      select: { id: true, title: true },
    })
    return NextResponse.json({ draft, existing })
  } catch (err) {
    if (err instanceof ImportError) return NextResponse.json({ error: err.message }, { status: 422 })
    console.error('[event-import] link import failed:', err)
    return NextResponse.json({ error: 'Import failed. Fill the form in by hand.' }, { status: 500 })
  }
}
