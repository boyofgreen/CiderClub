import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { extractWithAI, aiImportConfigured, ImportError } from '@/services/eventImport'

// Screenshots arrive as base64; ~5MB of image is plenty for a phone screenshot.
const MAX_IMAGE_BASE64 = 7_000_000

// GET — lets the admin page show whether screenshot import is set up.
export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json({ configured: aiImportConfigured() })
}

// POST /api/admin/events/extract — read a screenshot and/or pasted post text
// with Claude and return a draft for the admin to review. Saves nothing.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const imageBase64 = typeof body.imageBase64 === 'string' ? body.imageBase64 : undefined
  if (imageBase64 && imageBase64.length > MAX_IMAGE_BASE64) {
    return NextResponse.json({ error: 'That screenshot is too large — try a smaller one.' }, { status: 413 })
  }

  try {
    const draft = await extractWithAI({
      imageBase64,
      imageType: typeof body.imageType === 'string' ? body.imageType : undefined,
      text: typeof body.text === 'string' ? body.text.slice(0, 8000) : undefined,
    })
    return NextResponse.json({ draft })
  } catch (err) {
    if (err instanceof ImportError) return NextResponse.json({ error: err.message }, { status: 422 })
    console.error('[event-import] AI extraction failed:', err)
    return NextResponse.json({ error: 'Reading the event failed. Fill the form in by hand.' }, { status: 500 })
  }
}
