import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function main() {
  console.log('🌱 Seeding database...')

  // ─── Plans ────────────────────────────────────────────────────────────────

  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { slug: '6-pack-quarterly' },
      update: {},
      create: {
        name: '6-Pack Quarterly',
        slug: '6-pack-quarterly',
        description: 'Six cans of our seasonal selection, delivered to you every quarter. Perfect for the casual cider lover.',
        packsPerOrder: 6,
        priceInCents: 4800, // $48.00
        maxCapacity: 50,
        sortOrder: 0,
      },
    }),
    prisma.plan.upsert({
      where: { slug: '12-pack-quarterly' },
      update: {},
      create: {
        name: '12-Pack Quarterly',
        slug: '12-pack-quarterly',
        description: 'A full dozen of our finest ciders every quarter. Our most popular plan for the dedicated cider enthusiast.',
        packsPerOrder: 12,
        priceInCents: 8400, // $84.00
        maxCapacity: 30,
        sortOrder: 1,
      },
    }),
    prisma.plan.upsert({
      where: { slug: '24-pack-quarterly' },
      update: {},
      create: {
        name: '24-Pack Quarterly',
        slug: '24-pack-quarterly',
        description: 'Two dozen cans per quarter — ideal for households, parties, and true aficionados.',
        packsPerOrder: 24,
        priceInCents: 15600, // $156.00
        maxCapacity: 10,
        sortOrder: 2,
      },
    }),
  ])

  console.log(`✅ Created ${plans.length} plans`)

  // ─── Products ─────────────────────────────────────────────────────────────

  const productData = [
    {
      name: 'Golden Harvest Dry',
      slug: 'golden-harvest-dry',
      style: 'dry',
      abv: 6.5,
      description: 'Our flagship dry cider — crisp, clean, and made from a blend of heritage apples.',
    },
    {
      name: 'Honeycrisp Semi-Sweet',
      slug: 'honeycrisp-semi-sweet',
      style: 'semi-sweet',
      abv: 5.8,
      description: 'A lightly sweet cider with bright apple notes and a refreshing finish.',
    },
    {
      name: 'Hopped Harvest',
      slug: 'hopped-harvest',
      style: 'hopped',
      abv: 6.2,
      description: 'For the hop lover: our dry cider base meets Pacific Northwest hops for a truly unique sip.',
    },
    {
      name: 'Lavender & Honey',
      slug: 'lavender-and-honey',
      style: 'botanical',
      abv: 5.5,
      description: 'Delicate floral notes of lavender balanced with local wildflower honey.',
    },
    {
      name: 'Pear & Ginger',
      slug: 'pear-and-ginger',
      style: 'seasonal',
      abv: 6.0,
      description: 'Our spring seasonal: ripe Bartlett pear with a warming ginger finish.',
    },
    {
      name: 'Blackberry Tart',
      slug: 'blackberry-tart',
      style: 'seasonal',
      abv: 6.8,
      description: 'Deep blackberry flavor with a pleasantly tart backbone. A crowd favorite.',
    },
    {
      name: 'Barrel-Aged Heritage',
      slug: 'barrel-aged-heritage',
      style: 'dry',
      abv: 7.5,
      description: 'Aged six months in bourbon barrels. Complex, warming, and utterly unique.',
    },
    {
      name: 'Tropical Sunrise',
      slug: 'tropical-sunrise',
      style: 'semi-sweet',
      abv: 5.2,
      description: 'Mango, pineapple, and a hint of passion fruit bring the tropics to your glass.',
    },
  ]

  const products = await Promise.all(
    productData.map((p, i) =>
      prisma.product.upsert({
        where: { slug: p.slug },
        update: {},
        create: { ...p, sortOrder: i },
      })
    )
  )

  console.log(`✅ Created ${products.length} products`)

  // ─── Upcoming Quarter ──────────────────────────────────────────────────────

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() // 0-indexed
  const quarterNum = Math.floor(month / 3) + 1
  const nextQuarterNum = quarterNum === 4 ? 1 : quarterNum + 1
  const nextQuarterYear = quarterNum === 4 ? year + 1 : year

  const quarterLabel = `${nextQuarterYear}-Q${nextQuarterNum}`

  // Quarter dates: opens in ~2 months, ends 3 months later
  const startsAt = new Date(nextQuarterYear, (nextQuarterNum - 1) * 3, 1)
  const endsAt = new Date(nextQuarterYear, (nextQuarterNum - 1) * 3 + 2, 28)
  const pickupStartsAt = new Date(nextQuarterYear, (nextQuarterNum - 1) * 3 + 2, 15)
  const pickupEndsAt = new Date(nextQuarterYear, (nextQuarterNum - 1) * 3 + 2, 31)

  const quarter = await prisma.quarter.upsert({
    where: { label: quarterLabel },
    update: {},
    create: {
      label: quarterLabel,
      year: nextQuarterYear,
      quarter: nextQuarterNum,
      name: `${['Winter', 'Spring', 'Summer', 'Fall'][nextQuarterNum - 1]} ${nextQuarterYear}`,
      startsAt,
      endsAt,
      pickupStartsAt,
      pickupEndsAt,
      status: 'UPCOMING',
    },
  })

  console.log(`✅ Created quarter ${quarterLabel}`)

  // Add products to the quarter (first 6 as available, first 4 as defaults)
  const quarterProductData = products.slice(0, 6).map((p, i) => ({
    quarterId: quarter.id,
    productId: p.id,
    isDefault: i < 4,
    sortOrder: i,
  }))

  for (const qp of quarterProductData) {
    await prisma.quarterProduct.upsert({
      where: { quarterId_productId: { quarterId: qp.quarterId, productId: qp.productId } },
      update: {},
      create: qp,
    })
  }

  console.log(`✅ Added ${quarterProductData.length} products to ${quarterLabel}`)

  console.log('\n🎉 Seed complete!')
  console.log('\nNext steps:')
  console.log('  1. Add ADMIN_EMAILS to your .env (comma-separated)')
  console.log('  2. Set up Google/Facebook OAuth credentials')
  console.log('  3. Add your Square access token and Resend API key')
  console.log('  4. Visit /register to sign up your first member')
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
