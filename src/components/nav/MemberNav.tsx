'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Beer, LayoutDashboard, ShoppingBag, User, Calendar, Gift, Menu, X } from 'lucide-react'
import { useState } from 'react'

const nav = [
  { href: '/member/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/member/orders', label: 'My Orders', icon: ShoppingBag },
  { href: '/member/pickups', label: 'Pickups', icon: Calendar },
  { href: '/member/referrals', label: 'Referrals', icon: Gift },
  { href: '/member/profile', label: 'Profile', icon: User },
]

export function MemberNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Desktop top nav */}
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Logo */}
          <Link href="/member/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Beer className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-stone-900 hidden sm:block">
              {process.env.NEXT_PUBLIC_CLUB_NAME ?? 'CiderClub'}
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden md:flex items-center gap-1">
            {nav.map(({ href, label }) => {
              const active = pathname === href || (href !== '/member/dashboard' && pathname.startsWith(href))
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  )}
                >
                  {label}
                </Link>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {session?.user && (
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="hidden md:flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition"
              >
                Sign out
              </button>
            )}
            <button
              className="md:hidden p-2 text-stone-600 hover:text-stone-900"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-stone-200 bg-white px-4 py-3 md:hidden">
            <nav className="space-y-1">
              {nav.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || (href !== '/member/dashboard' && pathname.startsWith(href))
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
                      active
                        ? 'bg-brand-50 text-brand-700'
                        : 'text-stone-600 hover:bg-stone-50'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                )
              })}
              {session?.user && (
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
                >
                  Sign out
                </button>
              )}
            </nav>
          </div>
        )}
      </header>
    </>
  )
}
