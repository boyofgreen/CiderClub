import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createMember } from '@/services/members'
import { z } from 'zod'

const createSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phone: z.string().optional(),
  address1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  planId: z.string().min(1),
  referralCode: z.string().optional(),
  cardNonce: z.string().optional(),
})

// POST /api/members — public registration
export async function POST(req: Request) {
  const body = await req.json()
  const parsed = createSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  // Check if email already exists
  const existing = await prisma.member.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  })
  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists. Check your inbox for your access link.' },
      { status: 409 }
    )
  }

  try {
    const result = await createMember({
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
    })
    return NextResponse.json({ memberId: result.member.id, status: result.status })
  } catch (err) {
    console.error('Member creation error:', err)
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 })
  }
}

// GET /api/members — admin only
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status')
  const search = url.searchParams.get('search')
  const page = parseInt(url.searchParams.get('page') ?? '1')
  const limit = parseInt(url.searchParams.get('limit') ?? '25')

  // Case-insensitive search; each word must match a name or email so
  // "jason smi" finds Jason Smith.
  const terms = (search ?? '').trim().split(/\s+/).filter(Boolean)
  const where = {
    ...(status ? { status } : {}),
    ...(terms.length
      ? {
          AND: terms.map((term) => ({
            OR: [
              { firstName: { contains: term, mode: 'insensitive' as const } },
              { lastName: { contains: term, mode: 'insensitive' as const } },
              { email: { contains: term, mode: 'insensitive' as const } },
            ],
          })),
        }
      : {}),
  }

  const [members, total] = await Promise.all([
    prisma.member.findMany({
      where,
      include: { plan: true },
      orderBy: { joinedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.member.count({ where }),
  ])

  return NextResponse.json({ members, total, page, limit })
}
