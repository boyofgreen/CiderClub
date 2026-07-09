import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getSquareForOrg } from '@/lib/square'
import { prisma } from '@/lib/prisma'

export interface ImportPreviewMember {
  squareCustomerId: string
  firstName: string
  lastName: string
  email: string
  planId: string
  planName: string
  squareCardId: string | null
  hasCard: boolean
  alreadyImported: boolean
}

// GET — preview who would be imported (Square group members not yet in DB)
export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const plans = await prisma.plan.findMany()
  const { client: squareClient } = await getSquareForOrg()

  const allGroups: { id: string; name: string }[] = []
  for await (const group of await squareClient.customers.groups.list()) {
    if (group.id && group.name) allGroups.push({ id: group.id, name: group.name })
  }

  const existingMembers = await prisma.member.findMany({
    select: { squareCustomerId: true, email: true },
  })
  const existingSquareIds = new Set(existingMembers.map((m) => m.squareCustomerId).filter(Boolean))
  const existingEmails = new Set(existingMembers.map((m) => m.email.toLowerCase()))

  const preview: ImportPreviewMember[] = []

  for (const plan of plans) {
    const group = allGroups.find((g) => g.name.toLowerCase() === plan.name.toLowerCase())
    if (!group) continue

    let cursor: string | undefined
    do {
      const response = await squareClient.customers.search({
        cursor,
        query: { filter: { groupIds: { any: [group.id] } } },
      })

      for (const customer of response.customers ?? []) {
        if (!customer.id || !customer.emailAddress) continue

        const alreadyImported =
          existingSquareIds.has(customer.id) ||
          existingEmails.has(customer.emailAddress.toLowerCase())

        let squareCardId: string | null = null
        if (!alreadyImported) {
          try {
            for await (const card of await squareClient.cards.list({ customerId: customer.id })) {
              if (card.enabled !== false && card.id) {
                squareCardId = card.id
                break
              }
            }
          } catch {
            // member has no cards — that's fine
          }
        }

        preview.push({
          squareCustomerId: customer.id,
          firstName: customer.givenName ?? '',
          lastName: customer.familyName ?? '',
          email: customer.emailAddress,
          planId: plan.id,
          planName: plan.name,
          squareCardId,
          hasCard: !!squareCardId,
          alreadyImported,
        })
      }

      cursor = response.cursor ?? undefined
    } while (cursor)
  }

  return NextResponse.json({ preview })
}

// POST — create Member records for the selected customers
export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { members } = (await req.json()) as {
    members: Omit<ImportPreviewMember, 'alreadyImported' | 'hasCard'>[]
  }

  let imported = 0
  let skipped = 0

  for (const m of members) {
    try {
      await prisma.member.create({
        data: {
          firstName: m.firstName,
          lastName: m.lastName,
          email: m.email.toLowerCase(),
          planId: m.planId,
          squareCustomerId: m.squareCustomerId,
          squareCardId: m.squareCardId ?? null,
          status: 'ACTIVE',
        },
      })
      imported++
    } catch (err) {
      console.error(`[import] Skipped ${m.email}:`, err)
      skipped++
    }
  }

  return NextResponse.json({ imported, skipped })
}
