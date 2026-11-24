import { prisma } from '@/lib/prisma'

export const SETTING_KEYS = {
  SALES_TAX_PERCENT: 'salesTaxPercent',
  ADMIN_NOTIFY_EMAIL: 'adminNotifyEmail',
  WELCOME_FOLLOWUP_FROM: 'welcomeFollowupFrom',
  LEGACY_DISCOUNT_PERCENT: 'legacyDiscountPercent',
  LEGACY_MIN_BOTTLES: 'legacyMinBottles',
  LEGACY_EXPIRY_QUARTERS: 'legacyExpiryQuarters',
  SHIPPING_ENABLED: 'shippingEnabled',
  SHIPPING_FEE_CENTS: 'shippingFeeCents',
  SHIPPING_BOTTLES_PER_BOX: 'shippingBottlesPerBox',
  SHIPPING_TAXABLE: 'shippingTaxable',
  SHIPPING_STATES: 'shippingStates',
} as const

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.SALES_TAX_PERCENT]: '8.25',
  [SETTING_KEYS.ADMIN_NOTIFY_EMAIL]: '',
  [SETTING_KEYS.WELCOME_FOLLOWUP_FROM]: 'JB · Hill Country Cider House <jb@hillcountryciderhouse.com>',
  [SETTING_KEYS.LEGACY_DISCOUNT_PERCENT]: '10',
  [SETTING_KEYS.LEGACY_MIN_BOTTLES]: '3',
  [SETTING_KEYS.LEGACY_EXPIRY_QUARTERS]: '4',
  [SETTING_KEYS.SHIPPING_ENABLED]: 'true',
  [SETTING_KEYS.SHIPPING_FEE_CENTS]: '2500',
  [SETTING_KEYS.SHIPPING_BOTTLES_PER_BOX]: '3',
  // Texas taxes delivery charges on taxable items
  [SETTING_KEYS.SHIPPING_TAXABLE]: 'true',
  [SETTING_KEYS.SHIPPING_STATES]: 'TX',
}

export async function getSetting(key: string): Promise<string | null> {
  const row = await prisma.setting.findUnique({ where: { key } })
  return row?.value ?? DEFAULTS[key] ?? null
}

export async function getSalesTaxPercent(): Promise<number> {
  const raw = await getSetting(SETTING_KEYS.SALES_TAX_PERCENT)
  const n = Number(raw)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

/** Discount legacy members get on a quarterly order they opt in to. */
export async function getLegacyDiscountPercent(): Promise<number> {
  const n = Number(await getSetting(SETTING_KEYS.LEGACY_DISCOUNT_PERCENT))
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 10
}

/** Fewest bottles a legacy member can put in an opt-in order. */
export async function getLegacyMinBottles(): Promise<number> {
  const n = Number(await getSetting(SETTING_KEYS.LEGACY_MIN_BOTTLES))
  return Number.isFinite(n) && n >= 1 ? Math.round(n) : 1
}

/**
 * Quarterly offers a legacy member can pass on before the next one becomes a
 * final notice. 0 = legacy memberships never expire.
 */
export async function getLegacyExpiryQuarters(): Promise<number> {
  const n = Number(await getSetting(SETTING_KEYS.LEGACY_EXPIRY_QUARTERS))
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : 4
}

export interface ShippingSettings {
  enabled: boolean
  /** Flat fee for each box, in cents */
  feePerBoxCents: number
  /** Bottles that fit in one box; the fee is charged per started box */
  bottlesPerBox: number
  /** Whether sales tax applies to the shipping fee */
  taxable: boolean
  /** Two-letter states we ship to */
  states: string[]
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  const [enabled, fee, perBox, taxable, states] = await Promise.all([
    getSetting(SETTING_KEYS.SHIPPING_ENABLED),
    getSetting(SETTING_KEYS.SHIPPING_FEE_CENTS),
    getSetting(SETTING_KEYS.SHIPPING_BOTTLES_PER_BOX),
    getSetting(SETTING_KEYS.SHIPPING_TAXABLE),
    getSetting(SETTING_KEYS.SHIPPING_STATES),
  ])
  const feeN = Number(fee)
  const perBoxN = Number(perBox)
  return {
    enabled: enabled !== 'false',
    feePerBoxCents: Number.isFinite(feeN) && feeN >= 0 ? Math.round(feeN) : 2500,
    bottlesPerBox: Number.isFinite(perBoxN) && perBoxN >= 1 ? Math.round(perBoxN) : 3,
    taxable: taxable !== 'false',
    states: (states ?? 'TX')
      .split(/[\s,]+/)
      .map((s) => s.trim().toUpperCase())
      .filter((s) => /^[A-Z]{2}$/.test(s)),
  }
}

/** Address that receives the internal "new member joined" alert. */
export async function getAdminNotifyEmail(): Promise<string | null> {
  const raw = (await getSetting(SETTING_KEYS.ADMIN_NOTIFY_EMAIL))?.trim()
  if (raw) return raw
  // Fall back to the first configured admin email
  const fromEnv = process.env.ADMIN_EMAILS?.split(',')[0]?.trim()
  return fromEnv || null
}

/** From address used for the personal 24-hour welcome follow-up. */
export async function getWelcomeFollowupFrom(): Promise<string> {
  const raw = (await getSetting(SETTING_KEYS.WELCOME_FOLLOWUP_FROM))?.trim()
  return raw || DEFAULTS[SETTING_KEYS.WELCOME_FOLLOWUP_FROM]
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  })
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await prisma.setting.findMany()
  const map: Record<string, string> = { ...DEFAULTS }
  for (const r of rows) map[r.key] = r.value
  return map
}
