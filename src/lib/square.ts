import { SquareClient, SquareEnvironment } from 'square'
import { config } from '@/lib/config'

// SQUARE_ENVIRONMENT explicitly controls which Square API the app talks to.
// Set to 'production' for live tokens, 'sandbox' for test tokens.
// Defaults to sandbox unless explicitly set to production.
export const squareClient = new SquareClient({
  token: config.square.accessToken ?? 'sandbox-placeholder',
  environment:
    config.square.environment === 'production'
      ? SquareEnvironment.Production
      : SquareEnvironment.Sandbox,
})

export const squareConfigured = config.square.configured

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

const CARD_ERROR_MESSAGES: Record<string, string> = {
  INVALID_CARD_DATA: 'The card details look incorrect. Please check the number, expiration, CVV, and ZIP and try again.',
  INVALID_CARD: 'That card number is not valid. Please double-check and try again.',
  CARD_EXPIRED: 'That card has expired. Please use a different card.',
  INVALID_EXPIRATION: 'The expiration date is invalid. Please check the month and year.',
  INVALID_EXPIRATION_YEAR: 'The expiration year is invalid.',
  INVALID_EXPIRATION_DATE: 'The expiration date is invalid.',
  BAD_EXPIRATION: 'The expiration date is invalid.',
  UNSUPPORTED_CARD_BRAND: 'We do not accept that card brand. Please try a different card.',
  INVALID_POSTAL_CODE: 'The ZIP code does not match the card on file. Please check and try again.',
  VERIFY_CVV_FAILURE: 'The CVV code did not match. Please check the 3- or 4-digit code on the back of your card.',
  CVV_FAILURE: 'The CVV code did not match. Please check the 3- or 4-digit code on the back of your card.',
  VERIFY_AVS_FAILURE: 'The ZIP code did not match what your bank has on file. Please check and try again.',
  ADDRESS_VERIFICATION_FAILURE: 'The ZIP code did not match what your bank has on file. Please check and try again.',
  CARD_DECLINED: 'Your bank declined the card. Please try a different card or contact your bank.',
  CARD_DECLINED_CALL_ISSUER: 'Your bank declined the card. Please contact your bank or try a different card.',
  CARD_DECLINED_VERIFICATION_REQUIRED: 'Your bank requires additional verification. Please contact your bank or try a different card.',
  GENERIC_DECLINE: 'Your card was declined. Please try a different card.',
  INSUFFICIENT_FUNDS: 'The card has insufficient funds. Please try a different card.',
  CARD_TOKEN_EXPIRED: 'The form session expired. Please re-enter your card details and try again.',
  CARD_TOKEN_USED: 'That card was already submitted. Please re-enter your card details.',
  SOURCE_EXPIRED: 'The form session expired. Please re-enter your card details and try again.',
  SOURCE_USED: 'That card was already submitted. Please re-enter your card details.',
  INVALID_ACCOUNT: 'That account cannot be used. Please try a different card.',
  ALLOWABLE_PIN_TRIES_EXCEEDED: 'Too many failed attempts. Please contact your bank.',
  TRANSACTION_LIMIT: 'This charge exceeds the card limit. Please try a different card.',
}

/**
 * Convert a Square SDK error into a user-friendly message.
 * Falls back to "Something went wrong" for unknown errors so we never leak raw API bodies.
 */
export function formatSquareError(err: unknown): string {
  const errors = (err as { errors?: { code?: string; detail?: string }[] })?.errors
  const first = Array.isArray(errors) ? errors[0] : undefined
  if (first?.code && CARD_ERROR_MESSAGES[first.code]) {
    return CARD_ERROR_MESSAGES[first.code]
  }
  if (first?.detail) return first.detail
  return 'Something went wrong while saving your card. Please try again or use a different card.'
}
