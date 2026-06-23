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

  const settings = await getAllSettings()
  return NextResponse.json({ settings })
}
