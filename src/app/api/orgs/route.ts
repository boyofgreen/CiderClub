import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { config } from '@/lib/config'
import { createOrganization } from '@/services/orgs'

const createOrgSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(80, 'Name is too long'),
  slug: z.string().min(3).max(48),
})

/** Public URL for a tenant's portal, aware of local dev. */
function portalUrlFor(slug: string): string {
  const root = config.app.rootDomain
  if (root === 'localhost') return `http://${slug}.localhost:3000`
  return `https://${slug}.${root}`
}

// POST /api/orgs — create a new organization owned by the signed-in user
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to create an organization' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = createOrgSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  try {
    const org = await createOrganization({
      name: parsed.data.name,
      slug: parsed.data.slug,
      ownerUserId: session.user.id,
    })
    return NextResponse.json({
      org: { id: org.id, name: org.name, slug: org.slug },
      portalUrl: portalUrlFor(org.slug),
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create organization' },
      { status: 400 }
    )
  }
}
