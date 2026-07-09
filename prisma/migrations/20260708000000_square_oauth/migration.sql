-- ─── Phase 3: Per-tenant Square OAuth ─────────────────────────────────────────
-- Access/refresh tokens are stored encrypted (AES-256-GCM, src/lib/crypto.ts).

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "squareAccessToken" TEXT;
ALTER TABLE "Organization" ADD COLUMN "squareRefreshToken" TEXT;
ALTER TABLE "Organization" ADD COLUMN "squareTokenExpiresAt" TIMESTAMP(3);
