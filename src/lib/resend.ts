import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

export const fromEmail =
  process.env.RESEND_FROM_EMAIL ?? 'CiderClub <hello@example.com>'

export const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

export const clubName =
  process.env.NEXT_PUBLIC_CLUB_NAME ?? 'Cider Club'
