-- AlterTable: allow orders without a quarter (ad-hoc admin orders)
ALTER TABLE "Order" ALTER COLUMN "quarterId" DROP NOT NULL;
