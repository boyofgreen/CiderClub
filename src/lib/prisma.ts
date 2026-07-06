// Import directly from the generated client (non-hidden node_modules dir).
// This bypasses @prisma/client's default.js which requires .prisma/client/default —
// a hidden directory that Azure's Oryx strips from node_modules.tar.gz.
import { PrismaClient } from 'prisma-generated'
import { withTenancy } from '@/lib/tenancy'

function createClient() {
  const base = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
  // All tenant-model queries are automatically scoped to the active
  // organization (see src/lib/tenancy.ts).
  return withTenancy(base)
}

type TenantPrismaClient = ReturnType<typeof createClient>

const globalForPrisma = globalThis as unknown as { prisma?: TenantPrismaClient }

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
