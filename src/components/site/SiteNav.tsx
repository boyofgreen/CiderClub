'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, ExternalLink } from 'lucide-react'
import { NAV_LINKS } from '@/lib/siteInfo'

const LINK_STYLE: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  padding: '6px 10px',
  textDecoration: 'none',
  transition: 'color 0.15s',
  borderBottom: '2px solid transparent',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
}

export function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  return (
    <header
      style={{ backgroundColor: 'var(--navy)', borderBottom: '1px solid var(--rule)' }}
      className="sticky top-0 z-30"
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Wordmark */}
        <Link href="/" className="flex items-center gap-3 shrink-0" style={{ textDecoration: 'none' }}>
          <Image
            src="/brand/logo.png"
            alt="Hill Country Cider House"
            width={34}
            height={34}
            style={{ objectFit: 'contain' }}
          />
          <div className="flex flex-col leading-none" style={{ gap: 3 }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 400, letterSpacing: '0.02em', color: 'var(--cream)' }}>
              Hill Country
            </span>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)' }}>
              Cider House
            </span>
          </div>
        </Link>

        {/* Desktop links */}
        <nav className="hidden lg:flex items-center">
          {NAV_LINKS.map(({ href, label, external }) => {
            const active = !external && pathname === href
            return external ? (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={{ ...LINK_STYLE, color: 'rgba(247,241,227,0.65)' }}>
                {label} <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </a>
            ) : (
              <Link
                key={label}
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
          <Link
            href="/club"
            className="ml-3"
            style={{
              fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              backgroundColor: 'var(--gold)', color: 'var(--navy-deep)',
              padding: '9px 16px', textDecoration: 'none',
            }}
          >
            Join the Club
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden"
          onClick={() => setOpen(!open)}
          style={{ color: 'var(--cream)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 8 }}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div
          style={{ borderTop: '1px solid var(--rule)', backgroundColor: 'var(--navy-soft)' }}
          className="px-4 py-3 lg:hidden"
        >
          <nav>
            {NAV_LINKS.map(({ href, label, external }) => {
              const active = !external && pathname === href
              const style: React.CSSProperties = {
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                fontFamily: 'var(--font-sans)',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: active ? 'var(--gold)' : 'rgba(247,241,227,0.8)',
                borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
                textDecoration: 'none',
              }
              return external ? (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" style={style} onClick={() => setOpen(false)}>
                  {label} <ExternalLink className="h-3 w-3 opacity-60" />
                </a>
              ) : (
                <Link key={label} href={href} style={style} onClick={() => setOpen(false)}>
                  {label}
                </Link>
              )
            })}
            <Link
              href="/club"
              onClick={() => setOpen(false)}
              style={{
                display: 'inline-block', margin: '10px 12px 4px',
                fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                backgroundColor: 'var(--gold)', color: 'var(--navy-deep)',
                padding: '10px 18px', textDecoration: 'none',
              }}
            >
              Join the Club
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
