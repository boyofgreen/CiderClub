-- AlterTable
ALTER TABLE "Order" ADD COLUMN "billingAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "billingLockedAt" TIMESTAMP(3);
