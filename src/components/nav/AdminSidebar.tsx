'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
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
  Clock,
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

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-60 flex-col border-r border-stone-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-stone-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
          <Beer className="h-4 w-4 text-white" />
        </div>
        <span className="font-bold text-stone-900">
          {process.env.NEXT_PUBLIC_CLUB_NAME ?? 'CiderClub'}
        </span>
        <span className="ml-auto rounded bg-brand-100 px-1.5 py-0.5 text-xs font-semibold text-brand-700">
          Admin
        </span>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto p-3">
        <ul className="space-y-0.5">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/admin/dashboard' && pathname.startsWith(href))
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                    active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom: sign out */}
      <div className="border-t border-stone-200 p-3">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-50 hover:text-stone-900"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  )
}
