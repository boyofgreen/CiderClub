import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getTemplateDef } from '@/lib/emailTemplates'

// PUT — save an override for this template
export async function PUT(
  req: Request,
  { params }: { params: { key: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const def = getTemplateDef(params.key)
  if (!def) return NextResponse.json({ error: 'Unknown template' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
  const bodyHtml = typeof body.bodyHtml === 'string' ? body.bodyHtml.trim() : ''

  if (!subject || !bodyHtml) {
    return NextResponse.json({ error: 'Subject and body are required' }, { status: 400 })
  }

  const existing = await prisma.emailTemplate.findFirst({ where: { key: params.key } })
  const saved = existing
    ? await prisma.emailTemplate.update({
        where: {
          organizationId_key: { organizationId: existing.organizationId, key: params.key },
        },
        data: { subject, bodyHtml },
      })
    : await prisma.emailTemplate.create({ data: { key: params.key, subject, bodyHtml } })

  return NextResponse.json({ template: saved })
}

// DELETE — reset to the code default by removing the override
export async function DELETE(
  _req: Request,
  { params }: { params: { key: string } }
) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.emailTemplate.deleteMany({ where: { key: params.key } })
  return NextResponse.json({ ok: true })
}
