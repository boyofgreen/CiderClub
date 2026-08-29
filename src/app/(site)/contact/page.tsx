import Image from 'next/image'
import type { Metadata } from 'next'
import { ContactForm } from '@/components/site/ContactForm'
import { SITE, HOURS } from '@/lib/siteInfo'
import { MapPin, Phone, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Give us a ring, send us a text, email us, or fill out the form — Hill Country Cider House, Castroville TX.',
}

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-[38vh] min-h-[260px] w-full">
        <Image
          src="/site/contact-bar.webp"
          alt="A smiling host in a white cowboy hat behind the bar at Hill Country Cider House"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover', objectPosition: 'center 35%' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(26,37,64,0.45), rgba(26,37,64,0.75))' }} />
        <div className="absolute inset-0 flex items-center justify-center px-6 text-center">
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(30px, 5vw, 50px)',
              color: 'var(--cream)',
            }}
          >
            Contact Us
          </h1>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="mx-auto max-w-2xl text-center" style={{ color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.75 }}>
          Looking to learn even more about Hill Country Cider House? Give us a ring, send us a text, email
          us, or fill out the form below.
        </p>

        <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.1fr]">
          {/* Details */}
          <div>
            <p className="smallcaps mb-4" style={{ color: 'var(--terracotta)' }}>Reach Us Directly</p>
            <div className="space-y-4">
              <a href={SITE.phoneHref} className="flex items-start gap-3 hover:opacity-75 transition" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                <Phone className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--gold-deep)' }} />
                <span>
                  <span className="block text-xs" style={{ color: 'var(--ink-soft)' }}>Call or text</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 20 }}>{SITE.phone}</span>
                </span>
              </a>
              <a href={`mailto:${SITE.email}`} className="flex items-start gap-3 hover:opacity-75 transition" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                <Mail className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--gold-deep)' }} />
                <span>
                  <span className="block text-xs" style={{ color: 'var(--ink-soft)' }}>Email</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18, wordBreak: 'break-word' }}>{SITE.email}</span>
                </span>
              </a>
              <a href={SITE.addressMapUrl} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 hover:opacity-75 transition" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                <MapPin className="h-5 w-5 mt-0.5 shrink-0" style={{ color: 'var(--gold-deep)' }} />
                <span>
                  <span className="block text-xs" style={{ color: 'var(--ink-soft)' }}>Tasting room</span>
                  <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18 }}>{SITE.address}</span>
                </span>
              </a>
            </div>

            <p className="smallcaps mt-10 mb-3" style={{ color: 'var(--terracotta)' }}>Hours</p>
            <div className="border" style={{ borderColor: 'var(--rule)' }}>
              {HOURS.map((h, i) => (
                <div
                  key={h.days}
                  className="flex items-center justify-between px-4 py-2"
                  style={{ borderTop: i > 0 ? '1px solid var(--rule)' : 'none' }}
                >
                  <span className="text-sm" style={{ color: 'var(--ink-soft)' }}>{h.days}</span>
                  <span className="text-sm" style={{ color: h.hours === 'Closed' ? 'var(--ink-soft)' : 'var(--terracotta)' }}>
                    {h.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="border p-8" style={{ borderColor: 'var(--rule)', backgroundColor: 'var(--paper)' }}>
            <p className="smallcaps mb-5" style={{ color: 'var(--terracotta)' }}>Send Us a Note</p>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  )
}
