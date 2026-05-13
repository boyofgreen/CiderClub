import { Resend } from 'resend'

let _resend: Resend | null = null
export function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export const fromEmail =
  process.env.RESEND_FROM_EMAIL ?? 'Hill Country Cider Club <hello@hillcountryciderhouse.com>'

export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const clubName =
  process.env.NEXT_PUBLIC_CLUB_NAME ?? 'Hill Country Cider Club'
