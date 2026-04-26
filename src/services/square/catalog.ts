import { squareClient } from '@/lib/square'
import { prisma } from '@/lib/prisma'

const CIDER_CLUB_CATEGORY = 'Cider Club'
const ABV_ATTRIBUTE_NAME = 'abv'

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
      return obj.id
    }
  }
  return null
}

/**
 * Read an ABV custom-attribute value from a catalog object's customAttributeValues map.
 * Square keys can be prefixed with the defining app ID ("abcd1234:abv"), so we match
 * by the attribute's `name` (case-insensitive) and accept either NUMBER or STRING types.
 */
function extractAbv(customAttributes?: Record<string, { name?: string | null; numberValue?: string | null; stringValue?: string | null }>): number | null {
  if (!customAttributes) return null
  for (const value of Object.values(customAttributes)) {
    if (value?.name?.toLowerCase() === ABV_ATTRIBUTE_NAME) {
      const raw = value.numberValue ?? value.stringValue
      if (raw == null) return null
      const parsed = parseFloat(String(raw))
      return Number.isFinite(parsed) ? parsed : null
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
    const description = item.itemData.description ?? null
    const squareItemId = item.id
    const abv = extractAbv(item.customAttributeValues)

    const existing = await prisma.product.findFirst({ where: { squareItemId } })

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { name, description, abv },
      })
      updated++
    } else {
      // Build a unique slug — append a counter if there's a collision
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
          squareItemId,
          isActive: true,
        },
      })
      created++
    }
  }

  return { created, updated, skipped, total: items.length }
}
