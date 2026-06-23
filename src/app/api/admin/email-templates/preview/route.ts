import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getTemplateDef, renderPreview } from '@/lib/emailTemplates'

// POST — render an (unsaved) subject/body with the template's sample data.
// Returns full HTML for an iframe preview in the editor.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const def = getTemplateDef(body.key)
  if (!def) return NextResponse.json({ error: 'Unknown template' }, { status: 404 })

  const subject = typeof body.subject === 'string' ? body.subject : def.defaultSubject
  const bodyHtml = typeof body.bodyHtml === 'string' ? body.bodyHtml : def.defaultBody

  const rendered = renderPreview(subject, bodyHtml, def.sample)
  return NextResponse.json(rendered)
}
