import { prisma } from './prismaTestClient'

let n = 0
const uid = () => `t${(++n).toString(36)}${Math.random().toString(36).slice(2, 8)}`

export async function createPlan(overrides: Record<string, unknown> = {}) {
  const id = uid()
  return prisma.plan.create({
    data: {
      name: `Plan ${id}`,
      slug: `plan-${id}`,
      packsPerOrder: 2,
      priceInCents: 4200,
      discountPercent: 0,
      ...overrides,
    },
  })
}

export async function createProduct(overrides: Record<string, unknown> = {}) {
  const id = uid()
  return prisma.product.create({
    data: {
      name: `Product ${id}`,
      slug: `product-${id}`,
      priceInCents: 2000,
      ...overrides,
    },
  })
}

export async function createMember(planId: string, overrides: Record<string, unknown> = {}) {
  const id = uid()
  return prisma.member.create({
    data: {
      email: `member-${id}@test.local`,
      firstName: 'Test',
      lastName: `Member${id}`,
      planId,
      ...overrides,
    },
  })
}

/**
 * Create a quarter plus its available-product list.
 * `defaultProductIds` become QuarterProduct rows with isDefault = true.
 */
export async function createQuarter(
  defaultProductIds: string[] = [],
  overrides: Record<string, unknown> = {}
) {
  const id = uid()
  const quarter = await prisma.quarter.create({
    data: {
      label: `2099-Q1-${id}`,
      year: 2099,
      quarter: 1,
      startsAt: new Date('2099-01-01'),
      endsAt: new Date('2099-02-15'),
      ...overrides,
    },
  })
  for (const [i, productId] of defaultProductIds.entries()) {
    await prisma.quarterProduct.create({
      data: { quarterId: quarter.id, productId, isDefault: true, sortOrder: i },
    })
  }
  return quarter
}

export async function createOrder(params: {
  memberId: string
  quarterId: string | null
  status?: string
  totalInCents?: number
  items?: { productId: string; quantity: number; unitPriceInCents: number }[]
  [key: string]: unknown
}) {
  const { memberId, quarterId, status, totalInCents, items, ...rest } = params
  return prisma.order.create({
    data: {
      memberId,
      quarterId,
      status: status ?? 'LOCKED',
      totalInCents: totalInCents ?? 0,
      ...(items ? { items: { create: items } } : {}),
      ...rest,
    },
    include: { items: true },
  })
}

/** Pin the sales-tax setting so money math in tests is deterministic. */
export async function setSalesTax(percent: string) {
  await prisma.setting.upsert({
    where: { key: 'salesTaxPercent' },
    create: { key: 'salesTaxPercent', value: percent },
    update: { value: percent },
  })
}
