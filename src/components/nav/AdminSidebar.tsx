'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  Users,
  ShoppingBag,
  Calendar,
  Package,
  ClipboardList,
  Mail,
  BarChart3,
  ListOrdered,
  LogOut,
  Beer,
  Megaphone,
} from 'lucide-react'

const nav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/members', label: 'Members', icon: Users },
  { href: '/admin/quarters', label: 'Quarters', icon: Calendar },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/products', label: 'Products', icon: Beer },
  { href: '/admin/plans', label: 'Plans', icon: ClipboardList },
  { href: '/admin/pickups', label: 'Pickups', icon: Package },
  { href: '/admin/waitlist', label: 'Waitlist', icon: ListOrdered },
  { href: '/admin/campaigns', label: 'Campaigns', icon: Megaphone },
  { href: '/admin/email-logs', label: 'Email Logs', icon: Mail },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
]

const LINK_BASE: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '8px 12px',
  fontFamily: 'var(--font-sans)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  textDecoration: 'none',
  transition: 'color 0.15s, background-color 0.15s',
  borderLeft: '2px solid transparent',
}

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div
      className="flex h-full w-60 flex-col"
      style={{ backgroundColor: 'var(--navy)', borderRight: '1px solid var(--rule)' }}
    >
      {/* Logo / wordmark */}
      <div
        className="flex h-16 items-center gap-3 px-5"
        style={{ borderBottom: '1px solid var(--rule)' }}
      >
        <Image
          src="/brand/logo.png"
          alt="Hill Country Cider House"
          width={28}
          height={28}
          style={{ objectFit: 'contain' }}
        />
        <div className="flex flex-col leading-none" style={{ gap: 3 }}>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 12, fontWeight: 400, color: 'var(--cream)', letterSpacing: '0.02em' }}>
            Hill Country
          </span>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 7.5, fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: 'var(--gold)' }}>
            Cider House
          </span>
        </div>
        <span
          className="ml-auto"
          style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', backgroundColor: 'rgba(201,161,74,0.12)', padding: '3px 7px', border: '1px solid rgba(201,161,74,0.3)' }}
        >
          Admin
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  style={{
                    ...LINK_BASE,
                    color: active ? 'var(--gold)' : 'rgba(247,241,227,0.65)',
                    borderLeftColor: active ? 'var(--gold)' : 'transparent',
                    backgroundColor: active ? 'rgba(201,161,74,0.08)' : 'transparent',
                  }}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Sign out */}
      <div style={{ borderTop: '1px solid var(--rule)', padding: '8px' }}>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          style={{
            ...LINK_BASE,
            width: '100%',
            color: 'rgba(247,241,227,0.45)',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </div>
  )
}
