/**
 * Drop-in replacement for `@/lib/prisma` during tests (see vitest.config.ts alias).
 * Backs the Prisma client with an in-process PGlite Postgres instance, so tests
 * exercise the real migrations and real SQL without needing a database server.
 * Each vitest worker (test file) gets its own isolated instance.
 */
import { PGlite } from '@electric-sql/pglite'
import { PrismaPGlite } from 'pglite-prisma-adapter'
// The /wasm client build works on any CPU architecture (this machine is Windows
// ARM64, where the native query engine DLL cannot load). It requires a driver
// adapter, which is exactly how these tests run anyway.
import { PrismaClient } from 'prisma-generated/wasm'
import fs from 'fs'
import path from 'path'

export const pglite = new PGlite()

const adapter = new PrismaPGlite(pglite)
export const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0])

let initialized = false

/** Apply every Prisma migration, in order, to the fresh PGlite instance. */
export async function initTestDb(): Promise<void> {
  if (initialized) return
  const migrationsDir = path.resolve(__dirname, '../../prisma/migrations')
  const folders = fs
    .readdirSync(migrationsDir)
    .filter((f) => fs.statSync(path.join(migrationsDir, f)).isDirectory())
    .sort()
  for (const folder of folders) {
    const sql = fs.readFileSync(path.join(migrationsDir, folder, 'migration.sql'), 'utf8')
    await pglite.exec(sql)
  }
  initialized = true
}

/** Truncate all tables so each test starts from a blank database. */
export async function resetDb(): Promise<void> {
  await pglite.exec(`
    DO $$
    DECLARE r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" CASCADE';
      END LOOP;
    END $$;
  `)
}
