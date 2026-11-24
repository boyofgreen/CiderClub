-- Members can have a quarterly order shipped instead of picking it up.
ALTER TABLE "Order" ADD COLUMN "fulfillment" TEXT NOT NULL DEFAULT 'PICKUP';
ALTER TABLE "Order" ADD COLUMN "shippingInCents" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "shipName" TEXT;
ALTER TABLE "Order" ADD COLUMN "shipPhone" TEXT;
ALTER TABLE "Order" ADD COLUMN "shipAddress1" TEXT;
ALTER TABLE "Order" ADD COLUMN "shipAddress2" TEXT;
ALTER TABLE "Order" ADD COLUMN "shipCity" TEXT;
ALTER TABLE "Order" ADD COLUMN "shipState" TEXT;
ALTER TABLE "Order" ADD COLUMN "shipZip" TEXT;
ALTER TABLE "Order" ADD COLUMN "shippedAt" TIMESTAMP(3);
ALTER TABLE "Order" ADD COLUMN "trackingNumber" TEXT;
