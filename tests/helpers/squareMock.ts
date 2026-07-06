/**
 * Drop-in replacement for `@/lib/square` during tests (see vitest.config.ts alias).
 * Provides a controllable fake of the Square SDK client while re-exporting the
 * real helper functions. Services under test (payments, customers, cards,
 * inventory) run their actual logic against this fake.
 */
export { serializeSquare, toCents, toDollars, formatSquareError } from '../../src/lib/square'

export const squareConfigured = true

interface FakeLineItem {
  quantity: string
  basePriceMoney: { amount: bigint }
}

interface FakeOrderBody {
  lineItems?: FakeLineItem[]
  discounts?: { percentage?: string }[]
  taxes?: { percentage?: string }[]
}

/** Mutable state controlling fake behavior + recording calls for assertions. */
export const squareState = {
  failCharge: false,
  orderCreates: [] as unknown[],
  payments: [] as unknown[],
  paymentLinks: [] as unknown[],
  inventoryCalls: [] as unknown[],
  customerCreates: [] as unknown[],
  cardCreates: [] as unknown[],
  seq: 0,
}

export function resetSquareState(): void {
  squareState.failCharge = false
  squareState.orderCreates = []
  squareState.payments = []
  squareState.paymentLinks = []
  squareState.inventoryCalls = []
  squareState.customerCreates = []
  squareState.cardCreates = []
  squareState.seq = 0
}

/** Mimic Square's order math: subtotal → % discount → % additive tax. */
function computeOrderTotal(order: FakeOrderBody): number {
  const subtotal = (order.lineItems ?? []).reduce(
    (sum, li) => sum + Number(li.basePriceMoney.amount) * Number(li.quantity),
    0
  )
  const discountPct = Number(order.discounts?.[0]?.percentage ?? 0)
  const taxPct = Number(order.taxes?.[0]?.percentage ?? 0)
  const afterDiscount = Math.round(subtotal * (1 - discountPct / 100))
  return Math.round(afterDiscount * (1 + taxPct / 100))
}

export const squareClient = {
  orders: {
    create: async (req: { order: FakeOrderBody }) => {
      squareState.orderCreates.push(req)
      const total = computeOrderTotal(req.order)
      return {
        order: {
          id: `sq-order-${++squareState.seq}`,
          totalMoney: { amount: BigInt(total), currency: 'USD' },
        },
      }
    },
  },
  payments: {
    create: async (req: unknown) => {
      if (squareState.failCharge) {
        throw Object.assign(new Error('CARD_DECLINED'), {
          errors: [{ code: 'CARD_DECLINED', detail: 'Card declined (test)' }],
        })
      }
      squareState.payments.push(req)
      return {
        payment: {
          id: `sq-pay-${++squareState.seq}`,
          receiptUrl: 'https://squareup.com/receipt/test',
          status: 'COMPLETED',
        },
      }
    },
  },
  checkout: {
    paymentLinks: {
      create: async (req: unknown) => {
        squareState.paymentLinks.push(req)
        return {
          paymentLink: {
            id: `sq-link-${++squareState.seq}`,
            url: 'https://square.link/test',
          },
        }
      },
    },
  },
  inventory: {
    batchCreateChanges: async (req: unknown) => {
      squareState.inventoryCalls.push(req)
      return {}
    },
  },
  cards: {
    create: async (req: unknown) => {
      squareState.cardCreates.push(req)
      return {
        card: { id: `sq-card-${++squareState.seq}`, last4: '1111', cardBrand: 'VISA' },
      }
    },
    get: async () => ({ card: { id: 'sq-card-1', last4: '1111', cardBrand: 'VISA', expMonth: 12, expYear: 2030 } }),
    disable: async () => ({}),
  },
  customers: {
    create: async (req: unknown) => {
      squareState.customerCreates.push(req)
      return { customer: { id: `sq-cust-${++squareState.seq}` } }
    },
    search: async () => ({ customers: [] }),
    update: async () => ({ customer: {} }),
    get: async () => ({ customer: { note: '' } }),
    groups: {
      // `for await (const g of await groups.list())` — return an async iterable
      list: async () => (async function* () {})(),
      create: async () => ({ group: { id: `sq-group-${++squareState.seq}` } }),
      add: async () => ({}),
      remove: async () => ({}),
    },
  },
}
