import Link from 'next/link'
import Image from 'next/image'
import { HoursCard } from '@/components/site/HoursCard'
import { SITE } from '@/lib/siteInfo'
import { ArrowRight } from 'lucide-react'

const EXPERIENCES = [
  {
    title: 'Visit Our Tasting Room',
    img: '/site/pineapple-paradise.webp',
    alt: 'Pineapple Paradise cider bottle with garnished glasses and fresh pineapple',
    body: 'Whether you are looking for the small town Texas experience, or your local hangout, we serve cider with a smile. Family friendly and open Wednesday through Saturday.',
    cta: 'Visit Us',
    href: '/tasting-room',
  },
  {
    title: 'Join the Cider Club',
    img: '/site/lemongrass-lush.webp',
    alt: 'Lemongrass Lush cider bottle with lemon slices and a pitcher',
    body: 'Support our small business, get great deals on cider, and many more benefits. Become a cider in-sider, learn more below.',
    cta: 'Join the Club',
    href: '/club',
  },
  {
    title: 'Host an Event',
    img: '/site/cherry-bloom.webp',
    alt: 'Cherry Bloom cider on pink cloth with yellow flowers',
    body: 'Want to have our place be your place for the night? We host events in our tasting room and venue at Holiday Orchard in Comfort Tx.',
    cta: 'Learn More',
    href: '/saturdays-in-comfort',
  },
]

export default function HomePage() {
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative">
        <div className="relative h-[62vh] min-h-[420px] w-full">
          <Image
            src="/site/hero-tasting-room.webp"
            alt="Cider being served at Hill Country Cider House"
            fill
            priority
            sizes="100vw"
            style={{ objectFit: 'cover' }}
          />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(26,37,64,0.55), rgba(26,37,64,0.78))' }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            <p className="smallcaps mb-4" style={{ color: 'var(--gold)' }}>
              Castroville · Comfort · Texas
            </p>
            <h1
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(30px, 5.5vw, 60px)',
                color: 'var(--cream)',
                lineHeight: 1.15,
                maxWidth: 900,
              }}
            >
              Hard Cider Just a Stones Throw From San Antonio in Castroville TX
            </h1>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/tasting-room" className="btn-gold" style={{ textDecoration: 'none' }}>
                Visit the Tasting Room
              </Link>
              <Link href="/club" className="btn-ghost-navy" style={{ textDecoration: 'none' }}>
                Join the Cider Club
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── American Cider Meets Texas Hospitality ───────────────────── */}
      <section className="mx-auto max-w-4xl px-6 py-16 sm:py-20 text-center">
        <p className="smallcaps mb-4" style={{ color: 'var(--terracotta)' }}>Welcome, Partner</p>
        <h2
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontWeight: 400,
            fontSize: 'clamp(26px, 4vw, 40px)',
            color: 'var(--ink)',
            lineHeight: 1.25,
          }}
        >
          American Cider Meets Texas Hospitality
        </h2>
        <div className="mx-auto mt-6 max-w-2xl space-y-4" style={{ color: 'var(--ink-soft)', fontSize: 16, lineHeight: 1.75 }}>
          <p>
            Hard cider is an age-old American tradition, and we celebrate its rich roots in every glass of
            our cider. At Hill Country Cider House, you&apos;ll get a &ldquo;howdy&rdquo; with every visit, and a story
            with every glass. Whether you are new to cider or a life long fan, we have a cider for you.
          </p>
          <p>
            We welcome you to drop by our tasting room just minutes from San Antonio TX, in Castroville right
            on HWY 90. We have 6 ciders on tap (always one no-alcohol as well), and more than 20 different
            ciders in bottle. We are family friendly and &ldquo;sips&rdquo; are always free.
          </p>
        </div>
        <Link href="/tasting-room" className="btn-saloon mt-8" style={{ textDecoration: 'none' }}>
          Visit Us <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>

      {/* ── Saturdays in Comfort ─────────────────────────────────────── */}
      <section style={{ backgroundColor: 'var(--navy)' }}>
        <div className="mx-auto grid max-w-6xl items-center gap-0 lg:grid-cols-2">
          <div className="relative h-[300px] w-full lg:h-[480px]">
            <Image
              src="/site/comfort-table.webp"
              alt="Private tasting table set in natural light at Holiday Orchard"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              style={{ objectFit: 'cover' }}
            />
          </div>
          <div className="px-6 py-14 sm:px-12">
            <p className="smallcaps mb-4" style={{ color: 'var(--gold)' }}>Saturdays in Comfort</p>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(24px, 3.5vw, 38px)',
                color: 'var(--cream)',
                lineHeight: 1.25,
              }}
            >
              When you&apos;re here, your family.
            </h2>
            <p className="mt-5" style={{ color: 'rgba(247,241,227,0.72)', fontSize: 16, lineHeight: 1.75 }}>
              Saturdays in Comfort feel like stepping into your own private slice of the Hill
              Country&mdash;quiet rolling views, small&#8209;batch cider poured just for you, and a tasting
              experience that moves at your pace. One group, one table, one unforgettable Saturday.
            </p>
            <Link href="/saturdays-in-comfort" className="btn-gold mt-8" style={{ textDecoration: 'none' }}>
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* ── Experience Cider with Us ─────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <p className="smallcaps mb-3" style={{ color: 'var(--terracotta)' }}>Three Ways In</p>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: 'clamp(26px, 4vw, 40px)',
              color: 'var(--ink)',
            }}
          >
            Experience Cider with Us
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {EXPERIENCES.map((x) => (
            <div key={x.title} className="flex flex-col border bg-cream-paper" style={{ borderColor: 'var(--rule)' }}>
              <div className="relative w-full" style={{ aspectRatio: '4 / 3' }}>
                <Image src={x.img} alt={x.alt} fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontWeight: 400,
                    fontSize: 22,
                    color: 'var(--ink)',
                    marginBottom: 10,
                  }}
                >
                  {x.title}
                </h3>
                <p className="flex-1 text-sm" style={{ color: 'var(--ink-soft)', lineHeight: 1.7 }}>
                  {x.body}
                </p>
                <Link
                  href={x.href}
                  className="mt-5 inline-flex items-center gap-1.5 smallcaps hover:gap-2.5 transition-all"
                  style={{ color: 'var(--terracotta)', textDecoration: 'none' }}
                >
                  {x.cta} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Location & Hours ─────────────────────────────────────────── */}
      <section style={{ backgroundColor: 'var(--cream-deep)', borderTop: '1px solid var(--rule)' }}>
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
              Visit Our Tasting Room
            </h2>
          </div>
          <HoursCard />
        </div>
      </section>

      {/* ── Shop strip ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div
          className="flex flex-col items-center gap-6 border p-10 text-center sm:flex-row sm:justify-between sm:text-left"
          style={{ borderColor: 'var(--gold)', backgroundColor: 'var(--paper)' }}
        >
          <div>
            <h3 style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 26, color: 'var(--ink)' }}>
              Can&apos;t make it out to us?
            </h3>
            <p className="mt-1.5 text-sm" style={{ color: 'var(--ink-soft)' }}>
              Browse bottles, merch, and gift cards in our online shop.
            </p>
          </div>
          <a href={SITE.shop} target="_blank" rel="noopener noreferrer" className="btn-saloon shrink-0" style={{ textDecoration: 'none' }}>
            Shop Cider
          </a>
        </div>
      </section>
    </>
  )
}
