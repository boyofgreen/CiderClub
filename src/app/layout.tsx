import type { Metadata } from 'next'
import { Playfair_Display, Inter_Tight, Archivo, Libre_Franklin } from 'next/font/google'
import './globals.css'
import { SessionProvider } from '@/components/auth/SessionProvider'
import { PageViewTracker } from '@/components/PageViewTracker'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const archivo = Archivo({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
})

const libreFranklin = Libre_Franklin({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

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
    <html lang="en" className={`${playfair.variable} ${interTight.variable} ${archivo.variable} ${libreFranklin.variable}`}>
      <body>
        <SessionProvider>
          <PageViewTracker />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
