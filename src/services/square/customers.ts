import { squareClient } from '@/lib/square'
import { prisma } from '@/lib/prisma'
import { randomUUID } from 'crypto'

interface MemberInfo {
  id: string
  email: string
  firstName: string
  lastName: string
  phone?: string | null
  address1?: string | null
  city?: string | null
  state?: string | null
  zip?: string | null
}

/** Find or create a Square customer group by name; returns the group ID */
async function findOrCreateGroup(name: string): Promise<string> {
  const groups: { id?: string; name?: string }[] = []
  for await (const group of await squareClient.customers.groups.list()) {
    groups.push(group)
  }
  const existing = groups.find((g) => g.name === name)
  if (existing?.id) return existing.id

  const createResponse = await squareClient.customers.groups.create({
    idempotencyKey: randomUUID(),
    group: { name },
  })
  const groupId = createResponse.group?.id
  if (!groupId) throw new Error(`Failed to create Square group: ${name}`)
  return groupId
}

/** Create a Square customer and store the ID on the member record */
export async function createSquareCustomer(
  member: MemberInfo,
  planName?: string,
  joinedAt?: Date,
): Promise<string> {
  const existing = await searchSquareCustomerByEmail(member.email)
  if (existing) {
    await prisma.member.update({
      where: { id: member.id },
      data: { squareCustomerId: existing },
    })
    // Still try to add to group if we have a plan name
    if (planName) {
      try {
        const groupId = await findOrCreateGroup(planName)
        await squareClient.customers.groups.add({ customerId: existing, groupId })
      } catch (err) {
        console.error('[Square] Failed to add existing customer to group:', err)
      }
    }
    return existing
  }

  const joinDate = joinedAt ?? new Date()
  const joinDateStr = joinDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const note = [
    'Hill Country Cider Club member.',
    planName ? `Plan: ${planName}.` : null,
    `Joined: ${joinDateStr}.`,
  ].filter(Boolean).join(' ')

  const response = await squareClient.customers.create({
    idempotencyKey: randomUUID(),
    givenName: member.firstName,
    familyName: member.lastName,
    emailAddress: member.email,
    phoneNumber: member.phone ?? undefined,
    note,
    address: member.address1
      ? {
          addressLine1: member.address1,
          locality: member.city ?? undefined,
          administrativeDistrictLevel1: member.state ?? undefined,
          postalCode: member.zip ?? undefined,
          country: 'US',
        }
      : undefined,
  })

  const customerId = response.customer?.id
  if (!customerId) throw new Error('Square customer creation failed')

  await prisma.member.update({
    where: { id: member.id },
    data: { squareCustomerId: customerId },
  })

  // Add to the plan group
  if (planName) {
    try {
      const groupId = await findOrCreateGroup(planName)
      await squareClient.customers.groups.add({ customerId, groupId })
    } catch (err) {
      console.error('[Square] Failed to add customer to group:', err)
    }
  }

  return customerId
}

/** Push updated member info to Square */
export async function syncSquareCustomer(member: MemberInfo): Promise<void> {
  const dbMember = await prisma.member.findUnique({ where: { id: member.id } })
  if (!dbMember?.squareCustomerId) {
    await createSquareCustomer(member)
    return
  }

  await squareClient.customers.update({
    customerId: dbMember.squareCustomerId,
    givenName: member.firstName,
    familyName: member.lastName,
    emailAddress: member.email,
    phoneNumber: member.phone ?? undefined,
    address: member.address1
      ? {
          addressLine1: member.address1,
          locality: member.city ?? undefined,
          administrativeDistrictLevel1: member.state ?? undefined,
          postalCode: member.zip ?? undefined,
          country: 'US',
        }
      : undefined,
  })
}

/** Search Square for a customer by email; returns customerId or null */
export async function searchSquareCustomerByEmail(email: string): Promise<string | null> {
  try {
    const response = await squareClient.customers.search({
      query: {
        filter: {
          emailAddress: { exact: email },
        },
      },
    })
    return response.customers?.[0]?.id ?? null
  } catch {
    return null
  }
}
