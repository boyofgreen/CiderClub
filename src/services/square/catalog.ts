import { squareClient } from '@/lib/square'
import { prisma } from '@/lib/prisma'

const CIDER_CLUB_CATEGORY = 'Cider Club'

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

    const existing = await prisma.product.findFirst({ where: { squareItemId } })

    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { name, description },
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
          squareItemId,
          isActive: true,
        },
      })
      created++
    }
  }

  return { created, updated, skipped, total: items.length }
}
