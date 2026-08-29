import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { HoursCard } from '@/components/site/HoursCard'
import { SITE } from '@/lib/siteInfo'

export const metadata: Metadata = {
  title: 'Tasting Room',
  description:
    'Our Castroville tasting room on HWY 90 — 6 ciders on tap, 20+ in bottle, family friendly, open Wednesday through Saturday.',
}

export default function TastingRoomPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-[52vh] min-h-[360px] w-full">
        <Image
          src="/site/tasting-room-sign.webp"
          alt="Hill Country Cider House sign — Small Batch, Quality Cider, 2020"
          fill
          priority
          sizes="100vw"
          style={{ objectFit: 'cover' }}
        />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(26,37,64,0.5), rgba(26,37,64,0.75))' }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(28px, 5vw, 52px)',
              color: 'var(--cream)',
              lineHeight: 1.2,
              maxWidth: 820,
            }}
          >
            Don&apos;t just drink the cider, experience it.
          </h1>
          <p className="smallcaps mt-5" style={{ color: 'var(--gold)' }}>
            Where American cider meets Texas hospitality
          </p>
        </div>
      </section>

      {/* What's on offer */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-10 md:grid-cols-3 text-center">
          {[
            { stat: '6', label: 'Ciders on tap', note: 'Always one no-alcohol' },
            { stat: '20+', label: 'Ciders in bottle', note: 'Dry, fruit, botanical & more' },
            { stat: 'Free', label: '"Sips" always', note: 'Try before you pour' },
          ].map((s) => (
            <div key={s.label} className="border p-8" style={{ borderColor: 'var(--rule)', backgroundColor: 'var(--paper)' }}>
              <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 44, color: 'var(--terracotta)', lineHeight: 1 }}>
                {s.stat}
              </p>
              <p className="smallcaps mt-3" style={{ color: 'var(--ink)' }}>{s.label}</p>
              <p className="mt-1.5 text-xs" style={{ color: 'var(--ink-soft)' }}>{s.note}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-2xl text-center" style={{ color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.75 }}>
          <p>
            Whether you are looking for the small town Texas experience, or your local hangout, we serve
            cider with a smile. Family friendly and open Wednesday through Saturday.
          </p>
        </div>
      </section>

      {/* Location & hours */}
      <section style={{ backgroundColor: 'var(--cream-deep)', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)' }}>
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="text-center mb-10">
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(24px, 3.5vw, 34px)',
                color: 'var(--ink)',
              }}
            >
              Location and Hours
            </h2>
          </div>
          <HoursCard />
        </div>
      </section>

      {/* Questions */}
      <section className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(22px, 3vw, 30px)',
            color: 'var(--ink)',
          }}
        >
          Have questions or looking for more information?
        </h2>
        <p className="mt-4" style={{ color: 'var(--ink-soft)', fontSize: 16 }}>
          Call us at{' '}
          <a href={SITE.phoneHref} style={{ color: 'var(--terracotta)' }}>{SITE.phone}</a>{' '}
          or email us at{' '}
          <a href={`mailto:${SITE.email}`} style={{ color: 'var(--terracotta)' }}>{SITE.email}</a>
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/contact" className="btn-saloon" style={{ textDecoration: 'none' }}>
            Contact Us
          </Link>
          <Link href="/club" className="btn-outline-ink" style={{ textDecoration: 'none' }}>
            Join the Cider Club
          </Link>
        </div>
      </section>
    </>
  )
}
