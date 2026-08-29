import Link from 'next/link'
import Image from 'next/image'
import { SITE, HOURS } from '@/lib/siteInfo'
import { MapPin, Phone, Mail, Instagram, Facebook, ShoppingBag } from 'lucide-react'

export function SiteFooter() {
  return (
    <footer style={{ backgroundColor: 'var(--navy)', borderTop: '2px solid var(--gold)' }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Image src="/brand/logo.png" alt="Hill Country Cider House" width={40} height={40} style={{ objectFit: 'contain' }} />
            <div className="flex flex-col leading-none" style={{ gap: 3 }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--cream)' }}>Hill Country</span>
              <span style={{ fontFamily: 'var(--font-sans)', fontSize: 8, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: 'var(--gold)' }}>Cider House</span>
            </div>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'rgba(247,241,227,0.5)' }}>
            {SITE.tagline}
          </p>
          <div className="flex gap-3 mt-4">
            <a href={SITE.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook" style={{ color: 'rgba(247,241,227,0.55)' }} className="hover:opacity-80">
              <Facebook className="h-4 w-4" />
            </a>
            <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: 'rgba(247,241,227,0.55)' }} className="hover:opacity-80">
              <Instagram className="h-4 w-4" />
            </a>
            <a href={SITE.shop} target="_blank" rel="noopener noreferrer" aria-label="Shop" style={{ color: 'rgba(247,241,227,0.55)' }} className="hover:opacity-80">
              <ShoppingBag className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Visit */}
        <div>
          <p className="smallcaps mb-3" style={{ color: 'var(--gold)' }}>Visit</p>
          <a href={SITE.addressMapUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-2 text-xs leading-relaxed hover:opacity-80" style={{ color: 'rgba(247,241,227,0.7)', textDecoration: 'none' }}>
            <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" style={{ color: 'var(--gold)' }} />
            {SITE.address}
          </a>
          <div className="mt-3 space-y-1">
            {HOURS.map((h) => (
              <div key={h.days} className="flex justify-between text-xs" style={{ color: 'rgba(247,241,227,0.55)' }}>
                <span>{h.days}</span>
                <span>{h.hours}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div>
          <p className="smallcaps mb-3" style={{ color: 'var(--gold)' }}>Explore</p>
          <div className="flex flex-col gap-2">
            {[
              { href: '/tasting-room', label: 'Tasting Room' },
              { href: '/saturdays-in-comfort', label: "Saturday's in Comfort" },
              { href: '/apple-trees', label: 'Apple Trees' },
              { href: '/club', label: 'Join the Cider Club' },
              { href: '/about', label: 'About' },
              { href: '/contact', label: 'Contact' },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="text-xs hover:opacity-80" style={{ color: 'rgba(247,241,227,0.7)', textDecoration: 'none' }}>
                {l.label}
              </Link>
            ))}
            <a href={SITE.shop} target="_blank" rel="noopener noreferrer" className="text-xs hover:opacity-80" style={{ color: 'rgba(247,241,227,0.7)', textDecoration: 'none' }}>
              Shop
            </a>
          </div>
        </div>

        {/* Contact */}
        <div>
          <p className="smallcaps mb-3" style={{ color: 'var(--gold)' }}>Get in Touch</p>
          <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 text-xs hover:opacity-80 mb-2" style={{ color: 'rgba(247,241,227,0.7)', textDecoration: 'none' }}>
            <Mail className="h-3.5 w-3.5" style={{ color: 'var(--gold)' }} />
            {SITE.email}
          </a>
          <a href={SITE.phoneHref} className="flex items-center gap-2 text-xs hover:opacity-80" style={{ color: 'rgba(247,241,227,0.7)', textDecoration: 'none' }}>
            <Phone className="h-3.5 w-3.5" style={{ color: 'var(--gold)' }} />
            {SITE.phone}
          </a>
          <Link
            href="/login"
            className="inline-block mt-4 text-xs hover:opacity-80"
            style={{ color: 'rgba(247,241,227,0.45)', textDecoration: 'underline' }}
          >
            Member sign in
          </Link>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(201,161,74,0.25)' }} className="py-4 text-center">
        <p className="text-[11px]" style={{ color: 'rgba(247,241,227,0.4)' }}>
          © {new Date().getFullYear()} Hill Country Cider House. All rights reserved. · Castroville &amp; Comfort, Texas
        </p>
      </div>
    </footer>
  )
}
