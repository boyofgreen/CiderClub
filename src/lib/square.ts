import { SquareClient, SquareEnvironment } from 'square'

const token = process.env.SQUARE_ACCESS_TOKEN ?? 'sandbox-placeholder'

// SQUARE_ENVIRONMENT explicitly controls which Square API the app talks to.
// Set to 'production' for live tokens, 'sandbox' for test tokens.
// Defaults to sandbox unless explicitly set to production.
const squareEnvironment =
  process.env.SQUARE_ENVIRONMENT?.toLowerCase() === 'production'
    ? SquareEnvironment.Production
    : SquareEnvironment.Sandbox

export const squareClient = new SquareClient({
  token,
  environment: squareEnvironment,
})

export const squareConfigured = Boolean(process.env.SQUARE_ACCESS_TOKEN)

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
