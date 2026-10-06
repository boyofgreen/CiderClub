-- AlterTable
ALTER TABLE "ClubEvent" ADD COLUMN "ticketUrl" TEXT;
ALTER TABLE "ClubEvent" ADD COLUMN "priceText" TEXT;
ALTER TABLE "ClubEvent" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "ClubEvent" ADD COLUMN "sourceUrl" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ClubEvent_sourceUrl_key" ON "ClubEvent"("sourceUrl");
