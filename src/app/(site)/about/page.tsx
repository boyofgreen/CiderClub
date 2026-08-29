import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ContactForm } from '@/components/site/ContactForm'

export const metadata: Metadata = {
  title: 'About',
  description:
    'Hill Country Cider House is more than a cidery — a gathering place for curious palates in Comfort and Castroville, Texas.',
}

export default function AboutPage() {
  return (
    <>
      {/* Intro */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="smallcaps mb-4" style={{ color: 'var(--terracotta)' }}>Our Story</p>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(30px, 4.5vw, 48px)',
                color: 'var(--ink)',
                lineHeight: 1.2,
              }}
            >
              Who we are
            </h1>
            <div className="mt-6 space-y-4" style={{ color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.75 }}>
              <p>
                Whether it&rsquo;s a special event at our place nestled in the rolling hills of Comfort, Texas
                or an everyday visit to our tasting room in historic Castroville, Hill Country Cider House is
                more than a cidery&mdash;it&apos;s a gathering place for curious palates, passionate drinkers,
                and anyone who believes that apples deserve a little more spotlight.
              </p>
              <p>
                We are a family of craftsmen with a deep love for cider making and a flair for storytelling.
                Our cidery brings together tradition and innovation. Each batch is a blend of technical
                precision and creative spirit&mdash;whether it&apos;s a barrel aged dry or a fruit infused
                cider bursting with flavor.
              </p>
              <p>
                We host seasonal releases, themed events, and cider club gatherings that turn neighbors into
                friends and tastings into celebrations. From rodeo parties to orchard-inspired cocktail
                nights, we believe cider should be shared, savored, and occasionally frozen into a ciderita!
              </p>
              <p style={{ color: 'var(--ink)', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 20, lineHeight: 1.5 }}>
                At Hill Country Cider House, we&rsquo;re building more than a product&mdash;we&rsquo;re
                cultivating a community. Come for the cider, stay for the stories.
              </p>
            </div>
          </div>

          <div className="relative w-full" style={{ aspectRatio: '4 / 5' }}>
            <Image
              src="/site/about-bottles.webp"
              alt="Lemongrass and strawberry cider bottles with swing-top caps on a dark wooden shelf"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
        </div>
      </section>

      {/* Two homes */}
      <section style={{ backgroundColor: 'var(--navy)' }}>
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="grid gap-10 sm:grid-cols-2">
            {[
              {
                place: 'Castroville',
                title: 'The Tasting Room',
                body: 'Our everyday home on HWY 90, minutes from San Antonio. Six ciders on tap, twenty-plus in bottle, and a howdy with every visit.',
                href: '/tasting-room',
                cta: 'Plan a Visit',
              },
              {
                place: 'Comfort',
                title: 'Holiday Orchard',
                body: 'Twenty acres of rolling hill country views, reserved one group at a time for private Saturday tastings and events.',
                href: '/saturdays-in-comfort',
                cta: 'Book a Tasting',
              },
            ].map((c) => (
              <div key={c.place}>
                <p className="smallcaps mb-2" style={{ color: 'var(--gold)' }}>{c.place}, Texas</p>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 26, color: 'var(--cream)' }}>
                  {c.title}
                </h3>
                <p className="mt-3 text-sm" style={{ color: 'rgba(247,241,227,0.7)', lineHeight: 1.7 }}>
                  {c.body}
                </p>
                <Link href={c.href} className="btn-ghost-cream mt-6" style={{ textDecoration: 'none' }}>
                  {c.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="mx-auto max-w-2xl px-6 py-16 sm:py-20">
        <div className="text-center mb-8">
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(24px, 3.5vw, 34px)',
              color: 'var(--ink)',
            }}
          >
            Contact us
          </h2>
          <p className="mt-3" style={{ color: 'var(--ink-soft)', fontSize: 15, lineHeight: 1.7 }}>
            Want to learn more? Fill out some info and we will be in touch shortly. We can&rsquo;t wait to
            hear from you!
          </p>
        </div>
        <ContactForm />
      </section>
    </>
  )
}
