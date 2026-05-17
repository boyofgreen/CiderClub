import { prisma } from '@/lib/prisma'

export const SETTING_KEYS = {
  SALES_TAX_PERCENT: 'salesTaxPercent',
} as const

const DEFAULTS: Record<string, string> = {
  [SETTING_KEYS.SALES_TAX_PERCENT]: '8.25',
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
