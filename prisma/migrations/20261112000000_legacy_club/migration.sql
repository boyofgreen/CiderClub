-- Legacy club: members who opt in to each quarterly order instead of
-- receiving one automatically.
ALTER TABLE "Member" ADD COLUMN "legacyAt" TIMESTAMP(3);

-- Per-order terms that override the member's plan (used by legacy opt-in orders).
ALTER TABLE "Order" ADD COLUMN "discountPercent" INTEGER;
ALTER TABLE "Order" ADD COLUMN "minBottles" INTEGER;
