import { squareClient } from '@/lib/square'
import { prisma } from '@/lib/prisma'

const CIDER_CLUB_CATEGORY = 'Cider Club'

/** Match "ABV: 5.0%" anywhere in the description (case-insensitive) */
const ABV_PATTERN = /ABV:\s*(\d+(?:\.\d+)?)\s*%?/i

/** Extract ABV from a description and return the cleaned description + abv */
function parseAbvFromDescription(description: string | null): { description: string | null; abv: number | null } {
  if (!description) return { description, abv: null }
  const match = description.match(ABV_PATTERN)
  if (!match) return { description, abv: null }
  const abv = parseFloat(match[1])
  // Strip the ABV line so it doesn't render twice in the UI
  const cleaned = description
    .replace(ABV_PATTERN, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
  return {
    description: cleaned.length > 0 ? cleaned : null,
    abv: Number.isFinite(abv) ? abv : null,
  }
}

/** Generate a URL-safe slug from a product name */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Find the Square category whose name matches "Cider Club" */
async function findCiderClubCategoryId(): Promise<string | null> {
  // List all categories — there's no name filter so we paginate and search client-side
  const page = await squareClient.catalog.list({ types: 'CATEGORY' })
  for await (const obj of page) {
    if (obj.type === 'CATEGORY' && obj.categoryData?.name?.toLowerCase() === CIDER_CLUB_CATEGORY.toLowerCase()) {
      return obj.id ?? null
    }
  }
  return null
}

interface SyncResult {
  created: number
  updated: number
  skipped: number
  total: number
}

/**
 * Pull all catalog items in the "Cider Club" category from Square and upsert
 * them into the local Product table, keyed by squareItemId.
 */
export async function syncCiderClubProductsFromSquare(): Promise<SyncResult> {
  const categoryId = await findCiderClubCategoryId()
  if (!categoryId) {
    throw new Error(`No Square category named "${CIDER_CLUB_CATEGORY}" found`)
  }

  const response = await squareClient.catalog.searchItems({
    categoryIds: [categoryId],
    limit: 100,
  })

  const items = response.items ?? []
  let created = 0
  let updated = 0
  let skipped = 0

  for (const item of items) {
    if (item.type !== 'ITEM' || !item.id || !item.itemData?.name) {
      skipped++
      continue
    }

    const name = item.itemData.name
    const squareItemId = item.id
    const { description, abv } = parseAbvFromDescription(item.itemData.description ?? null)

    // Pull price and variation ID from the first variation.
    // Narrow the union type: variations are always ITEM_VARIATION objects.
    const firstVariation = item.itemData.variations?.[0]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const variationData = firstVariation?.type === 'ITEM_VARIATION' ? (firstVariation as any).itemVariationData : undefined
    const squareVariationId: string | null = firstVariation?.id ?? null
    const squarePriceBigInt: bigint | undefined = variationData?.priceMoney?.amount
    const priceInCents = squarePriceBigInt != null ? Number(squarePriceBigInt) : null

    const existing = await prisma.product.findFirst({ where: { squareItemId } })

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          name,
          description,
          abv,
          squareVariationId,
          // Always overwrite price from Square — Square is the source of truth
          ...(priceInCents != null && { priceInCents }),
        },
      })
      updated++
    } else {
      let slug = slugify(name)
      let suffix = 1
      while (await prisma.product.findUnique({ where: { slug } })) {
        slug = `${slugify(name)}-${suffix++}`
      }

      await prisma.product.create({
        data: {
          name,
          slug,
          description,
          abv,
          priceInCents: priceInCents ?? 2100,
          squareItemId,
          squareVariationId,
          isActive: true,
        },
      })
      created++
    }
  }

  return { created, updated, skipped, total: items.length }
}
