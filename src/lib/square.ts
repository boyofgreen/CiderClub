import { Client, Environment } from 'square'

export const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN!,
  environment:
    process.env.NODE_ENV === 'production'
      ? Environment.Production
      : Environment.Sandbox,
})

export const squareCustomers = squareClient.customersApi
export const squareCards = squareClient.cardsApi
export const squarePayments = squareClient.paymentsApi
export const squareCheckout = squareClient.checkoutApi
export const squareOrders = squareClient.ordersApi

/**
 * Square SDK uses BigInt for monetary amounts.
 * This helper serializes Square API responses to plain JSON-safe objects.
 */
export function serializeSquare<T>(obj: T): T {
  return JSON.parse(
    JSON.stringify(obj, (_, value) =>
      typeof value === 'bigint' ? Number(value) : value
    )
  )
}

/** Convert dollars to cents (Square uses cents as smallest unit) */
export function toCents(dollars: number): number {
  return Math.round(dollars * 100)
}

/** Convert cents to dollars */
export function toDollars(cents: number): number {
  return cents / 100
}
