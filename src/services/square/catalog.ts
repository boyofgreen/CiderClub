import { squareClient } from '@/lib/square'
import { prisma } from '@/lib/prisma'

const CIDER_CLUB_CATEGORY = 'Cider Club'

/** Match "ABV: 5.0%" anywhere in the description (case-insensitive) */
const ABV_PATTERN = /ABV:\s*(\d+(?:\.\d+)?)\s*%?/i

function parseAbvFromDescription(description: string | null): { description: string | null; abv: number | null } {
  if (!description) return { description, abv: null }
  const match = description.match(ABV_PATTERN)
  if (!match) return { description, abv: null }
  const abv = parseFloat(match[1])
  const cleaned = description.replace(ABV_PATTERN, '').replace(/\n{2,}/g, '\n').trim()
  return {
    description: cleaned.length > 0 ? cleaned : null,
    abv: Number.isFinite(abv) ? abv : null,
  }
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

/** Find the Square category whose name matches "Cider Club" */
async function findCiderClubCategoryId(): Promise<string | null> {
  let count = 0
  const page = await squareClient.catalog.list({ types: 'CATEGORY' })
  for await (const obj of page) {
    count++
    if (obj.type === 'CATEGORY' && obj.categoryData?.name?.toLowerCase() === CIDER_CLUB_CATEGORY.toLowerCase()) {
      return obj.id ?? null
    }
  }
  console.log(`[square-sync] Scanned ${count} categories, "${CIDER_CLUB_CATEGORY}" not found`)
  return null
}

export interface SyncResult {
  created: number
  updated: number
  skipped: number
  total: number
  errors: string[]
}

/**
 * Pull all catalog items in the "Cider Club" category from Square and upsert
 * them into the local Product table, keyed by squareItemId.
 */
export async function syncCiderClubProductsFromSquare(): Promise<SyncResult> {
  console.log('[square-sync] Starting catalog sync')

  let categoryId: string | null
  try {
    categoryId = await findCiderClubCategoryId()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Square catalog.list() failed: ${msg}`)
  }

  if (!categoryId) {
    throw new Error(
      `No Square category named "${CIDER_CLUB_CATEGORY}" found. ` +
      `Check that the category exists in your Square catalog and the name matches exactly.`
    )
  }

  console.log(`[square-sync] Found category ID: ${categoryId}`)

  let response: Awaited<ReturnType<typeof squareClient.catalog.searchItems>>
  try {
    response = await squareClient.catalog.searchItems({
      categoryIds: [categoryId],
      limit: 100,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Square catalog.searchItems() failed: ${msg}`)
  }

  const items = response.items ?? []
  console.log(`[square-sync] Found ${items.length} items in category`)

  let created = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const item of items) {
    if (item.type !== 'ITEM' || !item.id || !item.itemData?.name) {
      skipped++
      continue
    }

    const name = item.itemData.name
    const squareItemId = item.id

    try {
      const { description, abv } = parseAbvFromDescription(item.itemData.description ?? null)

      // Pull price and variation ID from the first variation
      const firstVariation = item.itemData.variations?.[0]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const variationData = firstVariation?.type === 'ITEM_VARIATION' ? (firstVariation as any).itemVariationData : undefined
      const squareVariationId: string | null = firstVariation?.id ?? null
      const squarePriceBigInt: bigint | undefined = variationData?.priceMoney?.amount
      const priceInCents = squarePriceBigInt != null ? Number(squarePriceBigInt) : null

      console.log(`[square-sync] ${name}: variationId=${squareVariationId}, price=${priceInCents}`)

      const existing = await prisma.product.findFirst({ where: { squareItemId } })

      if (existing) {
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name,
            description,
            abv,
            squareVariationId,
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`${name}: ${msg}`)
      console.error(`[square-sync] Failed to upsert "${name}":`, err)
    }
  }

  console.log(`[square-sync] Done — created=${created} updated=${updated} skipped=${skipped} errors=${errors.length}`)
  return { created, updated, skipped, total: items.length, errors }
}
