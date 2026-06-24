'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { LayoutDashboard, ShoppingBag, User, Calendar, Gift, Menu, X, PartyPopper } from 'lucide-react'
import { useState } from 'react'

const nav = [
  { href: '/member/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/member/orders', label: 'My Orders', icon: ShoppingBag },
  { href: '/member/pickups', label: 'Pickups', icon: Calendar },
  { href: '/member/events', label: 'Events', icon: PartyPopper },
  { href: '/member/referrals', label: 'Referrals', icon: Gift },
  { href: '/member/profile', label: 'Profile', icon: User },
]

const LINK_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  padding: '6px 12px',
  textDecoration: 'none',
  transition: 'color 0.15s',
  borderBottom: '2px solid transparent',
  display: 'inline-flex',
  alignItems: 'center',
}

export function MemberNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header
      style={{ backgroundColor: 'var(--navy)', borderBottom: '1px solid var(--rule)' }}
      className="sticky top-0 z-30"
    >
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Logo / wordmark */}
        <Link href="/member/dashboard" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
          <Image
            src="/brand/logo.png"
            alt="Hill Country Cider House"
            width={32}
            height={32}
            style={{ objectFit: 'contain' }}
          />
          <div className="hidden sm:flex flex-col leading-none" style={{ gap: 3 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 13, fontWeight: 400, letterSpacing: '0.02em', color: 'var(--cream)' }}>
              Hill Country
            </span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              Cider House
            </span>
          </div>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center">
          {nav.map(({ href, label }) => {
            const active = pathname === href || (href !== '/member/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                style={{
                  ...LINK_STYLE,
                  color: active ? 'var(--gold)' : 'rgba(247,241,227,0.65)',
                  borderBottomColor: active ? 'var(--gold)' : 'transparent',
                }}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Sign out + hamburger */}
        <div className="flex items-center gap-2">
          {session?.user && (
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="hidden md:inline-flex items-center"
              style={{
                ...LINK_STYLE,
                color: 'rgba(247,241,227,0.45)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          )}
          <button
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ color: 'var(--cream)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 8 }}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          style={{ borderTop: '1px solid var(--rule)', backgroundColor: 'var(--navy-soft)' }}
          className="px-4 py-3 md:hidden"
        >
          <nav>
            {nav.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/member/dashboard' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    fontFamily: 'var(--font-sans)',
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: active ? 'var(--gold)' : 'rgba(247,241,227,0.8)',
                    borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
                    textDecoration: 'none',
                  }}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              )
            })}
            {session?.user && (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  width: '100%',
                  fontFamily: 'var(--font-sans)',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: 'rgba(247,241,227,0.45)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Sign out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
