import Link from 'next/link'
import { Beer, Package, CreditCard, Mail, CheckCircle, ArrowRight, Users, Star } from 'lucide-react'

const clubName = process.env.NEXT_PUBLIC_CLUB_NAME ?? 'Cider Club'

export default async function LandingPage() {
  // Fetch active plans for pricing section
  let plans: Array<{
    id: string
    name: string
    description: string | null
    packsPerOrder: number
    priceInCents: number
  }> = []

  try {
    const { prisma } = await import('@/lib/prisma')
    plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
  } catch {
    // Plans will be empty if DB not yet set up
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b border-stone-100 bg-white/95 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
              <Beer className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-stone-900">{clubName}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/magic/request"
              className="text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              Member Login
            </Link>
            <Link
              href="/register"
              className="btn-primary text-sm"
            >
              Join the Club
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 py-24 text-center">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, #fbbf24 0%, transparent 50%), radial-gradient(circle at 75% 20%, #f59e0b 0%, transparent 40%)' }}
        />
        <div className="relative mx-auto max-w-3xl px-4">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-brand-800/50 px-4 py-1.5 text-sm font-medium text-amber-300 ring-1 ring-amber-500/30">
            <Star className="h-3.5 w-3.5" />
            Quarterly Craft Cider Club
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Your Favorite Ciders,<br />
            <span className="text-amber-400">Delivered Every Quarter</span>
          </h1>
          <p className="mt-6 text-lg text-amber-100/80 max-w-xl mx-auto">
            Join {clubName} and receive a curated selection of our finest small-batch ciders
            four times a year. Customize every box to match your taste.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register" className="btn-primary px-8 py-3 text-base">
              Join the Club <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#plans" className="text-sm font-medium text-amber-200 hover:text-white transition">
              View Plans →
            </a>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-brand-50">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900">How It Works</h2>
            <p className="mt-3 text-stone-600">Simple, flexible, and delicious</p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Users,
                step: '1',
                title: 'Join the Club',
                desc: 'Pick your plan size and sign up. No account password needed.',
              },
              {
                icon: Mail,
                step: '2',
                title: 'Get Notified',
                desc: "Each quarter we'll email you when your order is ready to customize.",
              },
              {
                icon: Package,
                step: '3',
                title: 'Choose Your Ciders',
                desc: 'Click your personal link and swap in your favorites from our lineup.',
              },
              {
                icon: CreditCard,
                step: '4',
                title: 'Pick Up & Pay',
                desc: "Pick up at our quarterly event. We'll charge your card at pickup.",
              },
            ].map((item) => (
              <div key={item.step} className="relative text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg">
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-2 right-[calc(50%-28px)] translate-x-full h-5 w-5 rounded-full bg-brand-200 text-xs font-bold text-brand-800 flex items-center justify-center">
                  {item.step}
                </div>
                <h3 className="font-semibold text-stone-900">{item.title}</h3>
                <p className="mt-1.5 text-sm text-stone-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section id="plans" className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-stone-900">Club Plans</h2>
            <p className="mt-3 text-stone-600">Billed quarterly. Cancel or pause anytime.</p>
          </div>

          {plans.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan, i) => (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-8 ${
                    i === 1
                      ? 'border-brand-500 bg-brand-600 text-white shadow-xl'
                      : 'border-stone-200 bg-white shadow-sm'
                  }`}
                >
                  {i === 1 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-400 px-3 py-0.5 text-xs font-bold text-amber-900">
                      Most Popular
                    </div>
                  )}
                  <h3 className={`text-xl font-bold ${i === 1 ? 'text-white' : 'text-stone-900'}`}>
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p className={`mt-2 text-sm ${i === 1 ? 'text-amber-100' : 'text-stone-500'}`}>
                      {plan.description}
                    </p>
                  )}
                  <div className="mt-4">
                    <span className={`text-4xl font-bold ${i === 1 ? 'text-white' : 'text-stone-900'}`}>
                      ${(plan.priceInCents / 100).toFixed(0)}
                    </span>
                    <span className={`text-sm ml-1 ${i === 1 ? 'text-amber-200' : 'text-stone-500'}`}>
                      / quarter
                    </span>
                  </div>
                  <ul className="mt-6 space-y-2">
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`h-4 w-4 shrink-0 ${i === 1 ? 'text-amber-300' : 'text-green-500'}`} />
                      <span className={i === 1 ? 'text-amber-100' : 'text-stone-700'}>
                        {plan.packsPerOrder} bottles per quarter
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`h-4 w-4 shrink-0 ${i === 1 ? 'text-amber-300' : 'text-green-500'}`} />
                      <span className={i === 1 ? 'text-amber-100' : 'text-stone-700'}>
                        Customize every order
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`h-4 w-4 shrink-0 ${i === 1 ? 'text-amber-300' : 'text-green-500'}`} />
                      <span className={i === 1 ? 'text-amber-100' : 'text-stone-700'}>
                        Pause or cancel anytime
                      </span>
                    </li>
                    <li className="flex items-center gap-2 text-sm">
                      <CheckCircle className={`h-4 w-4 shrink-0 ${i === 1 ? 'text-amber-300' : 'text-green-500'}`} />
                      <span className={i === 1 ? 'text-amber-100' : 'text-stone-700'}>
                        Early access to seasonal releases
                      </span>
                    </li>
                  </ul>
                  <Link
                    href={`/register?plan=${plan.id}`}
                    className={`mt-8 block rounded-xl py-3 text-center text-sm font-semibold transition ${
                      i === 1
                        ? 'bg-white text-brand-700 hover:bg-amber-50'
                        : 'bg-brand-600 text-white hover:bg-brand-700'
                    }`}
                  >
                    Get Started →
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-stone-500">
              <p>Club plans coming soon. Check back shortly!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-stone-900">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white">Ready to Join?</h2>
          <p className="mt-4 text-stone-400">
            Sign up today — no passwords, no hassle. Just great cider delivered to you every quarter.
          </p>
          <Link href="/register" className="mt-8 inline-flex btn-primary px-8 py-3 text-base">
            Join {clubName} <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-4 text-xs text-stone-600">
            Already a member?{' '}
            <Link href="/magic/request" className="text-stone-400 underline hover:text-white">
              Get your access link
            </Link>
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-800 bg-stone-900 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
                <Beer className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold text-stone-300">{clubName}</span>
            </div>
            <p className="text-xs text-stone-600">
              &copy; {new Date().getFullYear()} {clubName}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
