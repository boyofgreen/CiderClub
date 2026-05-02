import Link from 'next/link'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'

// Hardcoded tier copy — names/perks are final per design handoff
const TIER_COPY = [
  {
    level: 'Level I',
    name: 'The Pickers',
    bottles: 3,
    blurb: '"A fine place to start — three of our best, hand-picked."',
    perks: [
      '10% off club purchase bottles',
      '5% off every day',
      'One free pour each visit',
      'Open-bar pickup party',
    ],
  },
  {
    level: 'Level II',
    name: 'The Pressers',
    bottles: 6,
    blurb: '"Our most-loved tier — six bottles, open bar, and a front-row seat."',
    featured: true,
    perks: [
      '15% off club purchase bottles',
      '5% off every day',
      'Free pour for you + a guest',
      'Open-bar pickup party',
      'Early access to new releases',
    ],
  },
  {
    level: 'Level III',
    name: 'Cellar Crew',
    bottles: 9,
    blurb: '"For the devoted — nine bottles and first pick of every batch."',
    perks: [
      '20% off club purchase bottles',
      '10% off every day',
      'Free pour for you + a guest',
      'Open-bar pickup party',
      'First access to limited releases',
      'Free barrel-room reservation',
    ],
  },
]


const LINEUP_FALLBACK = [
  { name: 'Cherry Bloom',       style: 'Dry · Sparkling',   abv: 7.6, img: '/brand/cherry.jpg' },
  { name: 'Pineapple Paradise', style: 'Sweet · Tropical',  abv: 5.8, img: '/brand/pineapple.jpg' },
  { name: 'Lemongrass Lush',    style: 'Botanical · Bright', abv: 6.4, img: '/brand/lemongrass.jpg' },
  { name: 'Black Bart',         style: "Gentleman's Cider", abv: 6.8, img: '/brand/bottles-shelf.jpg' },
]
const IMG_KEYWORDS: [string, string][] = [
  ['cherry', '/brand/cherry.jpg'],
  ['pineapple', '/brand/pineapple.jpg'],
  ['lemon', '/brand/lemongrass.jpg'],
  ['lush', '/brand/lemongrass.jpg'],
]
const FALLBACK_IMGS = ['/brand/cherry.jpg', '/brand/pineapple.jpg', '/brand/lemongrass.jpg', '/brand/bottles-shelf.jpg']

async function getPageData() {
  try {
    const [plans, products, memberCount] = await Promise.all([
      prisma.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.product.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' }, take: 4 }),
      prisma.member.count({ where: { status: 'ACTIVE' } }),
    ])
    return { plans, products, memberCount }
  } catch {
    return { plans: [], products: [], memberCount: 142 }
  }
}

export default async function LandingPage() {
  const { plans, products, memberCount } = await getPageData()

  const lineup = products.length > 0
    ? products.map((p, i) => {
        const lower = p.name.toLowerCase()
        const img = IMG_KEYWORDS.find(([k]) => lower.includes(k))?.[1] ?? FALLBACK_IMGS[i % 4]
        return { name: p.name, style: [p.style].filter(Boolean).join(' · '), abv: p.abv, img }
      })
    : LINEUP_FALLBACK

  return (
    <div style={{ fontFamily: 'var(--font-sans)', color: 'var(--ink)' }}>

      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <header style={{ backgroundColor: 'var(--cream-deep)', borderBottom: '1px solid var(--rule)', position: 'sticky', top: 0, zIndex: 30 }}>
        <div className="mx-auto flex items-center justify-between" style={{ maxWidth: 1280, padding: '18px 56px' }}>
          <Link href="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <Image src="/brand/logo.png" alt="Hill Country Cider House" width={48} height={56} style={{ objectFit: 'contain', width: 48, height: 'auto' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18, color: 'var(--ink)', lineHeight: 1.1 }}>
                Hill Country
              </div>
              <div style={{ fontSize: 9, letterSpacing: '0.22em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold)' }}>
                CIDER HOUSE
              </div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center" style={{ gap: 32 }}>
            {[
              { label: 'TASTING ROOM',       href: 'https://www.hillcountryciderhouse.com/tasting-room' },
              { label: "SATURDAY'S IN COMFORT", href: 'https://www.hillcountryciderhouse.com/private-tastings-comfort-tx' },
              { label: 'APPLE TREES',        href: 'https://www.hillcountryciderhouse.com/apple-trees' },
              { label: 'ABOUT',              href: 'https://www.hillcountryciderhouse.com/about' },
              { label: 'CONTACT',            href: 'https://www.hillcountryciderhouse.com/contact' },
            ].map(({ label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 10, letterSpacing: '0.22em', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-soft)', textDecoration: 'none' }}>
                {label}
              </a>
            ))}
            <Link href="/register"
              style={{ fontSize: 10, letterSpacing: '0.22em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--navy)', textDecoration: 'none', borderBottom: '2px solid var(--gold)', paddingBottom: 2 }}>
              JOIN THE CLUB
            </Link>
            <Link href="/magic/request"
              style={{ fontSize: 10, letterSpacing: '0.22em', fontWeight: 600, textTransform: 'uppercase', color: 'var(--ink-soft)', opacity: 0.65, textDecoration: 'none' }}>
              MEMBER SIGN-IN
            </Link>
          </nav>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section className="hero-bg" style={{ padding: '100px 56px 120px' }}>
        <div className="mx-auto" style={{ maxWidth: 1280, display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 80, alignItems: 'center' }}>

          {/* Left */}
          <div>
            <div className="flex items-center gap-4" style={{ marginBottom: 32 }}>
              <div style={{ height: 1, width: 40, backgroundColor: 'var(--gold)', flexShrink: 0 }} />
              <span style={{ fontSize: 10, letterSpacing: '0.28em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold)' }}>
                A QUARTERLY CIDER CLUB ✦ HILL COUNTRY STRONG
              </span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(56px,6vw,92px)', fontWeight: 400, lineHeight: 0.96, letterSpacing: '-0.01em', color: 'var(--cream)', margin: '0 0 32px' }}>
              Pull up<br />a chair.<br />
              <em style={{ color: 'var(--gold-bright)' }}>You're family</em><br />
              now.
            </h1>

            <p style={{ fontSize: 19, lineHeight: 1.55, color: 'rgba(247,241,227,0.78)', maxWidth: 540, margin: '0 0 40px' }}>
              Four times a year, we set aside a small batch of our best ciders for the people who make this place feel like home. Pick the bottles you love. Bring a friend. We'll keep the porch light on.
            </p>

            <div className="flex flex-wrap items-center gap-4" style={{ marginBottom: 48 }}>
              <Link href="/register" className="btn-gold">Join the Club →</Link>
            </div>

            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 32 }}>
              <div className="flex items-start gap-12 flex-wrap">
                {[
                  { value: String(memberCount || 142), label: 'Members' },
                  { value: '26', label: 'Ciders & Counting' },
                  { value: '4×', label: 'Pickup Parties / yr' },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 36, color: 'var(--gold-bright)', lineHeight: 1 }}>
                      {value}
                    </div>
                    <div style={{ fontSize: 10, letterSpacing: '0.18em', fontWeight: 600, textTransform: 'uppercase', color: 'rgba(247,241,227,0.5)', marginTop: 6 }}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — party photo with stamp */}
          <div className="relative hidden lg:block" style={{ height: 520 }}>
            <div className="bottle-frame" style={{ position: 'absolute', inset: 0 }}>
              <Image src="/brand/party.png" alt="Hill Country Cider House tasting room" fill sizes="(max-width:1280px) 50vw, 640px" style={{ objectFit: 'cover', objectPosition: 'center top' }} />
            </div>

            {/* Members-only stamp */}
            <div style={{
              position: 'absolute', bottom: 32, right: 24,
              width: 130, height: 130, borderRadius: '50%',
              border: '2px solid var(--gold)',
              transform: 'rotate(-8deg)',
              backgroundColor: 'rgba(26,37,64,0.88)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', gap: 2,
            }}>
              <div style={{ fontSize: 8, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold)', lineHeight: 1.5 }}>
                MEMBERS<br />ONLY
              </div>
              <div style={{ fontSize: 7, letterSpacing: '0.16em', fontWeight: 700, textTransform: 'uppercase', color: 'rgba(201,161,74,0.7)', marginTop: 2 }}>
                UP TO
              </div>
              <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 28, color: 'var(--gold-bright)', lineHeight: 1 }}>
                20%
              </div>
              <div style={{ fontSize: 8, letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold)' }}>
                OFF BOTTLES
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────────── */}
      <section style={{ backgroundColor: 'var(--cream)', padding: '120px 56px' }}>
        <div className="mx-auto" style={{ maxWidth: 1280 }}>
          <div className="text-center" style={{ marginBottom: 64 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.28em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--terracotta)', marginBottom: 16 }}>
              HOW IT WORKS
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(40px,4vw,64px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--ink)', margin: '0 0 24px' }}>
              <em>Four seasons,</em> four good reasons
            </h2>
            <div className="flex items-center justify-center gap-3">
              <div className="rule-gold" style={{ width: 60 }} />
              <span className="star-divider">✦ ✦ ✦</span>
              <div className="rule-gold" style={{ width: 60 }} />
            </div>
          </div>

          {/* 4-col grid — 1px gold gap creates divider lines */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 1, backgroundColor: 'var(--rule)' }}>
            {[
              { roman: 'I.', title: 'Saddle Up', body: 'Pick your tier, tell us a bit about yourself, and drop a card on file. Takes about two minutes.' },
              { roman: 'II.', title: 'We Holler', body: "When the new quarter opens, you'll get an email with a personal link to your order." },
              { roman: 'III.', title: 'Pick Your Bottles', body: 'Swap in your favorites from the lineup. Or keep our picks — your call, always.' },
              { roman: 'IV.', title: 'Come On Down', body: 'Pick up at our quarterly party or when you are ready. We charge your card on file and hand you your haul.' },
            ].map(({ roman, title, body }) => (
              <div key={roman} style={{ backgroundColor: 'var(--cream)', padding: '48px 36px' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 56, fontWeight: 400, color: 'var(--gold-deep)', lineHeight: 1, marginBottom: 20 }}>
                  {roman}
                </div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 26, fontWeight: 400, color: 'var(--ink)', margin: '0 0 12px' }}>
                  {title}
                </h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--ink-soft)', margin: 0 }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TIER CARDS ───────────────────────────────────────────────── */}
      <section style={{ backgroundColor: 'var(--cream-deep)', padding: '120px 56px' }}>
        <div className="mx-auto" style={{ maxWidth: 1280 }}>
          <div className="text-center" style={{ marginBottom: 64 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.28em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 16 }}>
              THREE TIERS
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(40px,4vw,64px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--ink)', margin: '0 0 16px' }}>
              Choose your <em>seat at the table</em>
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-soft)', margin: 0 }}>
              Billed quarterly when you pick up. Pause whenever you'd like. Cancel any time, no hard feelings.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 28, alignItems: 'start' }}>
            {TIER_COPY.map((tier, i) => {
              const plan = plans[i] ?? null
              const featured = !!tier.featured
              return (
                <div key={tier.level} style={{ position: 'relative', paddingTop: featured ? 16 : 0 }}>
                  {featured && (
                    <div style={{
                      position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                      backgroundColor: 'var(--terracotta)', color: 'var(--cream)',
                      fontSize: 10, letterSpacing: '0.18em', fontWeight: 700, textTransform: 'uppercase',
                      padding: '5px 18px', whiteSpace: 'nowrap',
                    }}>
                      ★ Most Picked ★
                    </div>
                  )}

                  <div style={{
                    backgroundColor: featured ? 'var(--navy)' : 'var(--paper)',
                    border: `1px solid ${featured ? 'var(--gold)' : 'var(--rule)'}`,
                    boxShadow: featured
                      ? '0 30px 60px rgba(26,37,64,0.25)'
                      : '0 1px 0 rgba(255,255,255,0.6) inset, 0 4px 14px rgba(26,37,64,0.06)',
                  }}>
                    {/* Level + name + bottles */}
                    <div style={{ padding: '36px 32px 28px', textAlign: 'center', borderBottom: `1px solid ${featured ? 'var(--rule-strong)' : 'var(--rule)'}` }}>
                      <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18, color: featured ? 'var(--gold)' : 'var(--gold-deep)', marginBottom: 8 }}>
                        {tier.level}
                      </div>
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: 38, fontWeight: 400, color: featured ? 'var(--cream)' : 'var(--ink)', margin: '0 0 12px' }}>
                        {tier.name}
                      </h3>
                      <div style={{ fontSize: 10, letterSpacing: '0.22em', fontWeight: 700, textTransform: 'uppercase', color: featured ? 'rgba(247,241,227,0.5)' : 'var(--ink-soft)' }}>
                        {tier.bottles} BOTTLES · EVERY QUARTER
                      </div>
                    </div>

                    {/* Bottle count */}
                    <div style={{ padding: '28px 32px', textAlign: 'center', borderBottom: `1px solid ${featured ? 'var(--rule-strong)' : 'var(--rule)'}` }}>
                      <div className="flex items-baseline justify-center" style={{ gap: 8 }}>
                        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 64, fontWeight: 400, color: featured ? 'var(--gold-bright)' : 'var(--ink)', lineHeight: 1 }}>
                          {tier.bottles}
                        </span>
                        <span style={{ fontSize: 14, color: featured ? 'rgba(247,241,227,0.5)' : 'var(--ink-soft)' }}>bottles / quarter</span>
                      </div>
                      <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 14, color: featured ? 'rgba(247,241,227,0.7)' : 'var(--ink-soft)', margin: '12px 0 0' }}>
                        {tier.blurb}
                      </p>
                    </div>

                    {/* Perks + CTA */}
                    <div style={{ padding: '24px 32px 32px' }}>
                      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {tier.perks.map((perk) => (
                          <li key={perk} className="flex items-start gap-2.5" style={{ fontSize: 14, color: featured ? 'rgba(247,241,227,0.82)' : 'var(--ink-soft)' }}>
                            <span style={{ color: featured ? 'var(--gold-bright)' : 'var(--terracotta)', marginTop: 2, flexShrink: 0, fontSize: 10 }}>✦</span>
                            {perk}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={plan ? `/register?plan=${plan.id}` : '/register'}
                        style={{ display: 'block', textAlign: 'center' }}
                        className={featured ? 'btn-gold' : 'btn-saloon'}
                      >
                        Saddle Up →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <p className="text-center" style={{ marginTop: 40, fontSize: 14, color: 'var(--ink-soft)' }}>
            Already a member?{' '}
            <Link href="/magic/request" className="link-saloon">Get your access link →</Link>
          </p>
        </div>
      </section>

      {/* ── LINEUP ───────────────────────────────────────────────────── */}
      <section id="lineup" className="hero-bg" style={{ padding: '120px 56px' }}>
        <div className="mx-auto" style={{ maxWidth: 1280 }}>
          <div className="flex items-end justify-between flex-wrap gap-8" style={{ borderBottom: '1px solid var(--rule)', paddingBottom: 32, marginBottom: 48 }}>
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.28em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>
                THIS QUARTER'S POUR
              </div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(40px,4vw,64px)', fontWeight: 400, lineHeight: 1.05, color: 'var(--cream)', margin: 0 }}>
                Spring '26 <em>Lineup</em>
              </h2>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'rgba(247,241,227,0.6)', maxWidth: 300, margin: 0, textAlign: 'right' }}>
              Members can mix any combination from the lineup — defaults are set, but the choice is always yours.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
            {lineup.map((bottle) => (
              <div key={bottle.name}>
                <div className="bottle-frame" style={{ position: 'relative', paddingBottom: '133%' }}>
                  <Image src={bottle.img} alt={bottle.name} fill sizes="(max-width:768px) 50vw, 25vw" style={{ objectFit: 'cover' }} />
                </div>
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 24, color: 'var(--cream)' }}>
                    {bottle.name}
                  </div>
                  <div style={{ fontSize: 9, letterSpacing: '0.22em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold)', marginTop: 4 }}>
                    {bottle.style}{bottle.abv ? ` · ${bottle.abv}%` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOUNDER LETTER ───────────────────────────────────────────── */}
      <section style={{ backgroundColor: 'var(--cream)', padding: '120px 56px' }}>
        <div className="mx-auto text-center" style={{ maxWidth: 720 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 80, color: 'var(--gold)', lineHeight: 0.8, marginBottom: 24 }}>
            "
          </div>
          <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 32, lineHeight: 1.4, color: 'var(--ink)', margin: 0 }}>
            We started with a folding table and one cider. Five years on, this club is how we say thank you to the folks who make our cider a part of their lives.
          </p>
          <div style={{ height: 1, width: 80, backgroundColor: 'var(--gold)', margin: '48px auto 24px' }} />
          <div style={{ fontSize: 10, letterSpacing: '0.22em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--terracotta)' }}>
            — JB · Founder, Hill Country Cider House
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: 'var(--navy-deep)', padding: '80px 56px 40px' }}>
        <div className="mx-auto" style={{ maxWidth: 1280 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 48, paddingBottom: 48, borderBottom: '1px solid var(--rule)' }}>
            {/* Col 1 */}
            <div>
              <div style={{ marginBottom: 20 }}>
                <Image src="/brand/logo.png" alt="Hill Country Cider House" width={70} height={82} style={{ objectFit: 'contain', width: 70, height: 'auto' }} />
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(247,241,227,0.5)', margin: 0 }}>
                Small-batch craft cider, pressed and bottled in the Texas Hill Country since 2020.
              </p>
            </div>

            {/* Link cols */}
            {([
              {
                heading: 'VISIT',
                items: [
                  { label: 'Tasting Room', href: 'https://www.hillcountryciderhouse.com/tasting-room' },
                  { label: 'Saturdays in Comfort', href: 'https://www.hillcountryciderhouse.com/private-tastings-comfort-tx' },
                  { label: 'Apple Trees', href: 'https://www.hillcountryciderhouse.com/apple-trees' },
                  { label: 'Supper Club', href: 'https://ticketscandy.com/e/the-italian-table-a-summer-supper-in-the-hill-country-by-hill-country-cider-house-16385' },
                ],
              },
              {
                heading: 'CLUB',
                items: [
                  { label: 'Join the Club', href: '/register' },
                  { label: 'Member Sign-in', href: '/magic/request' },
                  { label: 'FAQs', href: 'https://www.hillcountryciderhouse.com/faqs' },
                  { label: 'Pickup Schedule', href: null },
                ],
              },
              {
                heading: 'REACH US',
                items: [
                  { label: 'hello@hillcountryciderhouse.com', href: 'mailto:hello@hillcountryciderhouse.com' },
                  { label: '(830) 344-0441', href: 'tel:+18303440441' },
                  { label: 'Comfort, Texas', href: null },
                  { label: '@hillcountrycider', href: 'https://instagram.com/hillcountrycider' },
                ],
              },
            ] as const).map(({ heading, items }) => (
              <div key={heading}>
                <div style={{ fontSize: 10, letterSpacing: '0.28em', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gold-bright)', marginBottom: 20 }}>
                  {heading}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {items.map(({ label, href }) => (
                    <li key={label}>
                      {href ? (
                        <Link href={href} style={{ fontSize: 13, color: 'rgba(247,241,227,0.5)', textDecoration: 'none' }}
                          {...(href.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                          {label}
                        </Link>
                      ) : (
                        <span style={{ fontSize: 13, color: 'rgba(247,241,227,0.5)' }}>{label}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4" style={{ marginTop: 32 }}>
            <span style={{ fontSize: 10, letterSpacing: '0.14em', fontWeight: 600, textTransform: 'uppercase', color: 'rgba(247,241,227,0.28)' }}>
              © 2026 Hill Country Cider House · Small Batch · Quality Cider
            </span>
            <span style={{ fontSize: 10, letterSpacing: '0.14em', fontWeight: 600, textTransform: 'uppercase', color: 'rgba(247,241,227,0.28)' }}>
              Drink responsibly · 21+
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
