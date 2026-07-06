-- ─── Phase 1: Multi-tenancy — Organization table + organizationId everywhere ──
-- Backfill-safe: existing rows are assigned to the default organization
-- ("tenant zero" — the original Hill Country Cider Club), then columns are
-- tightened to NOT NULL. Runs correctly on both a populated production
-- database and a fresh empty one.

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "customDomain" TEXT,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "squareMerchantId" TEXT,
    "squareLocationId" TEXT,
    "fromEmail" TEXT,
    "planTier" TEXT NOT NULL DEFAULT 'FOUNDER',
    "trialEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE UNIQUE INDEX "Organization_customDomain_key" ON "Organization"("customDomain");
CREATE UNIQUE INDEX "Organization_squareMerchantId_key" ON "Organization"("squareMerchantId");

-- Tenant zero: the original club. Fixed id so the backfill below is deterministic.
INSERT INTO "Organization" ("id", "name", "slug", "updatedAt")
VALUES ('org_tenant_zero_hcch', 'Hill Country Cider Club', 'hill-country-cider-house', CURRENT_TIMESTAMP);

-- ─── Add organizationId (nullable → backfill → NOT NULL) ─────────────────────

ALTER TABLE "Member" ADD COLUMN "organizationId" TEXT;
UPDATE "Member" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "Member" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "MemberToken" ADD COLUMN "organizationId" TEXT;
UPDATE "MemberToken" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "MemberToken" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "Plan" ADD COLUMN "organizationId" TEXT;
UPDATE "Plan" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "Plan" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "Product" ADD COLUMN "organizationId" TEXT;
UPDATE "Product" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "Product" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "Quarter" ADD COLUMN "organizationId" TEXT;
UPDATE "Quarter" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "Quarter" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "Order" ADD COLUMN "organizationId" TEXT;
UPDATE "Order" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "Order" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "PickupEvent" ADD COLUMN "organizationId" TEXT;
UPDATE "PickupEvent" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "PickupEvent" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "WaitlistEntry" ADD COLUMN "organizationId" TEXT;
UPDATE "WaitlistEntry" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "WaitlistEntry" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "Lead" ADD COLUMN "organizationId" TEXT;
UPDATE "Lead" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "Lead" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "Campaign" ADD COLUMN "organizationId" TEXT;
UPDATE "Campaign" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "Campaign" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "EmailLog" ADD COLUMN "organizationId" TEXT;
UPDATE "EmailLog" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "EmailLog" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "PageView" ADD COLUMN "organizationId" TEXT;
UPDATE "PageView" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "PageView" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "ClubEvent" ADD COLUMN "organizationId" TEXT;
UPDATE "ClubEvent" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "ClubEvent" ALTER COLUMN "organizationId" SET NOT NULL;

ALTER TABLE "AnalyticsSnapshot" ADD COLUMN "organizationId" TEXT;
UPDATE "AnalyticsSnapshot" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "AnalyticsSnapshot" ALTER COLUMN "organizationId" SET NOT NULL;

-- Setting and EmailTemplate: key was the primary key; becomes (organizationId, key)
ALTER TABLE "Setting" ADD COLUMN "organizationId" TEXT;
UPDATE "Setting" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "Setting" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "Setting" DROP CONSTRAINT "Setting_pkey";
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_pkey" PRIMARY KEY ("organizationId", "key");

ALTER TABLE "EmailTemplate" ADD COLUMN "organizationId" TEXT;
UPDATE "EmailTemplate" SET "organizationId" = 'org_tenant_zero_hcch';
ALTER TABLE "EmailTemplate" ALTER COLUMN "organizationId" SET NOT NULL;
ALTER TABLE "EmailTemplate" DROP CONSTRAINT "EmailTemplate_pkey";
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("organizationId", "key");

-- ─── Swap global uniques for per-organization composites ─────────────────────

-- DropIndex
DROP INDEX "Member_email_key";
DROP INDEX "Plan_name_key";
DROP INDEX "Plan_slug_key";
DROP INDEX "Product_slug_key";
DROP INDEX "Quarter_label_key";
DROP INDEX "Lead_email_key";
DROP INDEX "AnalyticsSnapshot_snapshotDate_key";

-- CreateIndex
CREATE INDEX "Member_organizationId_idx" ON "Member"("organizationId");
CREATE UNIQUE INDEX "Member_organizationId_email_key" ON "Member"("organizationId", "email");
CREATE INDEX "MemberToken_organizationId_idx" ON "MemberToken"("organizationId");
CREATE INDEX "Plan_organizationId_idx" ON "Plan"("organizationId");
CREATE UNIQUE INDEX "Plan_organizationId_name_key" ON "Plan"("organizationId", "name");
CREATE UNIQUE INDEX "Plan_organizationId_slug_key" ON "Plan"("organizationId", "slug");
CREATE INDEX "Product_organizationId_idx" ON "Product"("organizationId");
CREATE UNIQUE INDEX "Product_organizationId_slug_key" ON "Product"("organizationId", "slug");
CREATE INDEX "Quarter_organizationId_idx" ON "Quarter"("organizationId");
CREATE UNIQUE INDEX "Quarter_organizationId_label_key" ON "Quarter"("organizationId", "label");
CREATE INDEX "Order_organizationId_idx" ON "Order"("organizationId");
CREATE INDEX "PickupEvent_organizationId_idx" ON "PickupEvent"("organizationId");
CREATE INDEX "WaitlistEntry_organizationId_idx" ON "WaitlistEntry"("organizationId");
CREATE INDEX "Lead_organizationId_idx" ON "Lead"("organizationId");
CREATE UNIQUE INDEX "Lead_organizationId_email_key" ON "Lead"("organizationId", "email");
CREATE INDEX "Campaign_organizationId_idx" ON "Campaign"("organizationId");
CREATE INDEX "EmailLog_organizationId_idx" ON "EmailLog"("organizationId");
CREATE INDEX "PageView_organizationId_idx" ON "PageView"("organizationId");
CREATE INDEX "ClubEvent_organizationId_idx" ON "ClubEvent"("organizationId");
CREATE INDEX "AnalyticsSnapshot_organizationId_idx" ON "AnalyticsSnapshot"("organizationId");
CREATE UNIQUE INDEX "AnalyticsSnapshot_organizationId_snapshotDate_key" ON "AnalyticsSnapshot"("organizationId", "snapshotDate");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MemberToken" ADD CONSTRAINT "MemberToken_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Quarter" ADD CONSTRAINT "Quarter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PickupEvent" ADD CONSTRAINT "PickupEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WaitlistEntry" ADD CONSTRAINT "WaitlistEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Setting" ADD CONSTRAINT "Setting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EmailTemplate" ADD CONSTRAINT "EmailTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PageView" ADD CONSTRAINT "PageView_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClubEvent" ADD CONSTRAINT "ClubEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── Transitional default ─────────────────────────────────────────────────────
-- organizationId defaults to tenant zero so Prisma create types don't require
-- it; the tenancy extension (src/lib/tenancy.ts) always injects the real org
-- at runtime. Remove these defaults once per-tenant routing is fully rolled
-- out and RLS enforces isolation.
ALTER TABLE "Member" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
ALTER TABLE "MemberToken" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
ALTER TABLE "Plan" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
ALTER TABLE "Product" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
ALTER TABLE "Quarter" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
ALTER TABLE "Order" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
ALTER TABLE "PickupEvent" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
ALTER TABLE "WaitlistEntry" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
ALTER TABLE "Lead" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
ALTER TABLE "Campaign" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
ALTER TABLE "EmailLog" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
ALTER TABLE "Setting" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
ALTER TABLE "EmailTemplate" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
ALTER TABLE "PageView" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
ALTER TABLE "ClubEvent" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
ALTER TABLE "AnalyticsSnapshot" ALTER COLUMN "organizationId" SET DEFAULT 'org_tenant_zero_hcch';
