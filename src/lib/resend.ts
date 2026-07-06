import { Resend } from 'resend'
import { config } from '@/lib/config'

let _resend: Resend | null = null
export function getResend(): Resend {
  if (!_resend) _resend = new Resend(config.resend.apiKey)
  return _resend
}

export const fromEmail = config.resend.fromEmail

export const appUrl = config.app.url

export const clubName = config.app.clubName
