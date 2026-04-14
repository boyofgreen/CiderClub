import { squareCustomers, serializeSquare } from '@/lib/square'
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

/** Create a Square customer and store the ID on the member record */
export async function createSquareCustomer(member: MemberInfo): Promise<string> {
  // First, check if a customer already exists with this email
  const existing = await searchSquareCustomerByEmail(member.email)
  if (existing) {
    await prisma.member.update({
      where: { id: member.id },
      data: { squareCustomerId: existing },
    })
    return existing
  }

  const { result } = await squareCustomers.createCustomer({
    idempotencyKey: randomUUID(),
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

  const customerId = result.customer?.id
  if (!customerId) throw new Error('Square customer creation failed')

  await prisma.member.update({
    where: { id: member.id },
    data: { squareCustomerId: customerId },
  })

  return customerId
}

/** Push updated member info to Square */
export async function syncSquareCustomer(member: MemberInfo): Promise<void> {
  if (!member.id) return

  const dbMember = await prisma.member.findUnique({ where: { id: member.id } })
  if (!dbMember?.squareCustomerId) {
    await createSquareCustomer(member)
    return
  }

  await squareCustomers.updateCustomer(dbMember.squareCustomerId, {
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
    const { result } = await squareCustomers.searchCustomers({
      query: {
        filter: {
          emailAddress: { exact: email },
        },
      },
    })
    return result.customers?.[0]?.id ?? null
  } catch {
    return null
  }
}
