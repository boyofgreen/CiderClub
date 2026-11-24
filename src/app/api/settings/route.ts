import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getAllSettings, setSetting, SETTING_KEYS } from '@/lib/settings'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const settings = await getAllSettings()
  return NextResponse.json({ settings })
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))

  if (typeof body.salesTaxPercent !== 'undefined') {
    const n = Number(body.salesTaxPercent)
    if (!Number.isFinite(n) || n < 0 || n > 100) {
      return NextResponse.json(
        { error: 'salesTaxPercent must be between 0 and 100' },
        { status: 400 }
      )
    }
    await setSetting(SETTING_KEYS.SALES_TAX_PERCENT, String(n))
  }

  if (typeof body.adminNotifyEmail !== 'undefined') {
    await setSetting(SETTING_KEYS.ADMIN_NOTIFY_EMAIL, String(body.adminNotifyEmail).trim())
  }

  if (typeof body.welcomeFollowupFrom !== 'undefined') {
    await setSetting(SETTING_KEYS.WELCOME_FOLLOWUP_FROM, String(body.welcomeFollowupFrom).trim())
  }

  if (typeof body.legacyDiscountPercent !== 'undefined') {
    const n = Number(body.legacyDiscountPercent)
    if (!Number.isInteger(n) || n < 0 || n > 100) {
      return NextResponse.json(
        { error: 'Legacy discount must be a whole number between 0 and 100' },
        { status: 400 }
      )
    }
    await setSetting(SETTING_KEYS.LEGACY_DISCOUNT_PERCENT, String(n))
  }

  if (typeof body.legacyMinBottles !== 'undefined') {
    const n = Number(body.legacyMinBottles)
    if (!Number.isInteger(n) || n < 1 || n > 100) {
      return NextResponse.json(
        { error: 'Legacy minimum bottles must be a whole number of 1 or more' },
        { status: 400 }
      )
    }
    await setSetting(SETTING_KEYS.LEGACY_MIN_BOTTLES, String(n))
  }

  if (typeof body.legacyExpiryQuarters !== 'undefined') {
    const n = Number(body.legacyExpiryQuarters)
    if (!Number.isInteger(n) || n < 0 || n > 40) {
      return NextResponse.json(
        { error: 'Legacy expiry must be a whole number of quarters (0 to never expire)' },
        { status: 400 }
      )
    }
    await setSetting(SETTING_KEYS.LEGACY_EXPIRY_QUARTERS, String(n))
  }

  if (typeof body.shippingEnabled !== 'undefined') {
    await setSetting(SETTING_KEYS.SHIPPING_ENABLED, body.shippingEnabled === true || body.shippingEnabled === 'true' ? 'true' : 'false')
  }

  if (typeof body.shippingTaxable !== 'undefined') {
    await setSetting(SETTING_KEYS.SHIPPING_TAXABLE, body.shippingTaxable === true || body.shippingTaxable === 'true' ? 'true' : 'false')
  }

  if (typeof body.shippingFee !== 'undefined') {
    const dollars = Number(body.shippingFee)
    if (!Number.isFinite(dollars) || dollars < 0 || dollars > 1000) {
      return NextResponse.json({ error: 'Shipping fee must be a dollar amount between 0 and 1000' }, { status: 400 })
    }
    await setSetting(SETTING_KEYS.SHIPPING_FEE_CENTS, String(Math.round(dollars * 100)))
  }

  if (typeof body.shippingBottlesPerBox !== 'undefined') {
    const n = Number(body.shippingBottlesPerBox)
    if (!Number.isInteger(n) || n < 1 || n > 48) {
      return NextResponse.json({ error: 'Bottles per box must be a whole number of 1 or more' }, { status: 400 })
    }
    await setSetting(SETTING_KEYS.SHIPPING_BOTTLES_PER_BOX, String(n))
  }

  if (typeof body.shippingStates !== 'undefined') {
    const states = String(body.shippingStates)
      .split(/[\s,]+/)
      .map((x) => x.trim().toUpperCase())
      .filter(Boolean)
    if (states.some((x) => !/^[A-Z]{2}$/.test(x))) {
      return NextResponse.json({ error: 'Ship-to states must be two-letter codes, like TX' }, { status: 400 })
    }
    await setSetting(SETTING_KEYS.SHIPPING_STATES, states.join(','))
  }

  const settings = await getAllSettings()
  return NextResponse.json({ settings })
}
