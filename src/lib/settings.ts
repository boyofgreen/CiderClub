import { prisma } from '@/lib/prisma'

export const SETTING_KEYS = {
  SALES_TAX_PERCENT: 'salesTaxPercent',
  ADMIN_NOTIFY_EMAIL: 'adminNotifyEmail',
  WELCOME_FOLLOWUP_FROM: 'welcomeFollowupFrom',
  LEGACY_DISCOUNT_PERCENT: 'legacyDiscountPercent',
  LEGACY_MIN_BOTTLES: 'legacyMinBottles',
} as const

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.SALES_TAX_PERCENT]: '8.25',
  [SETTING_KEYS.ADMIN_NOTIFY_EMAIL]: '',
  [SETTING_KEYS.WELCOME_FOLLOWUP_FROM]: 'JB · Hill Country Cider House <jb@hillcountryciderhouse.com>',
  [SETTING_KEYS.LEGACY_DISCOUNT_PERCENT]: '10',
  [SETTING_KEYS.LEGACY_MIN_BOTTLES]: '3',
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
