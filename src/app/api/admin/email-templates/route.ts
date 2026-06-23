import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { EMAIL_TEMPLATE_DEFS } from '@/lib/emailTemplates'

// GET — list every editable template, merging code defaults with DB overrides
export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const overrides = await prisma.emailTemplate.findMany()
  const overrideByKey = new Map(overrides.map((o) => [o.key, o]))

  const templates = EMAIL_TEMPLATE_DEFS.map((def) => {
    const override = overrideByKey.get(def.key)
    return {
      key: def.key,
      label: def.label,
      description: def.description,
      vars: def.vars,
      defaultSubject: def.defaultSubject,
      defaultBody: def.defaultBody,
      subject: override?.subject ?? def.defaultSubject,
      bodyHtml: override?.bodyHtml ?? def.defaultBody,
      isCustomized: !!override,
      updatedAt: override?.updatedAt ?? null,
    }
  })

  return NextResponse.json({ templates })
}
