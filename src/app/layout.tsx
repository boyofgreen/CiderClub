import type { Metadata } from 'next'
import './globals.css'
import { SessionProvider } from '@/components/auth/SessionProvider'

const clubName = process.env.NEXT_PUBLIC_CLUB_NAME ?? 'Cider Club'

export const metadata: Metadata = {
  title: {
    template: `%s | ${clubName}`,
    default: clubName,
  },
  description: `Join ${clubName} — quarterly craft cider delivered to your door or ready for pickup.`,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
