-- ─── Phase 2: Organization membership (operator roles) ───────────────────────
-- OrganizationUser links platform Users to the Organizations they operate.
-- Backfill: every legacy ADMIN user becomes OWNER of tenant zero and a
-- platform superadmin (they are the platform's founders).

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "OrganizationUser" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ADMIN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrganizationUser_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationUser_organizationId_userId_key" ON "OrganizationUser"("organizationId", "userId");
CREATE INDEX "OrganizationUser_userId_idx" ON "OrganizationUser"("userId");

-- AddForeignKey
ALTER TABLE "OrganizationUser" ADD CONSTRAINT "OrganizationUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrganizationUser" ADD CONSTRAINT "OrganizationUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: legacy ADMIN users own tenant zero and are platform superadmins
INSERT INTO "OrganizationUser" ("id", "organizationId", "userId", "role", "updatedAt")
SELECT 'orguser_' || "id", 'org_tenant_zero_hcch', "id", 'OWNER', CURRENT_TIMESTAMP
FROM "User" WHERE "role" = 'ADMIN';

UPDATE "User" SET "isSuperAdmin" = true WHERE "role" = 'ADMIN';
