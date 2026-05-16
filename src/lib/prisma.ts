// Import directly from the generated client (non-hidden node_modules dir).
// This bypasses @prisma/client's default.js which requires .prisma/client/default —
// a hidden directory that Azure's Oryx strips from node_modules.tar.gz.
import { PrismaClient } from 'prisma-generated'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
