-- CreateTable
CREATE TABLE "Setting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("key")
);

-- Seed default sales tax rate (8.25%)
INSERT INTO "Setting" ("key", "value", "updatedAt") VALUES ('salesTaxPercent', '8.25', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
