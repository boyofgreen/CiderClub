-- AlterTable
ALTER TABLE "ClubEvent" ADD COLUMN "soldOut" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ClubEvent" ADD COLUMN "ticketStatus" TEXT;
ALTER TABLE "ClubEvent" ADD COLUMN "ticketStatusCheckedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EventImage" (
    "id" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "contentType" TEXT NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventImage_pkey" PRIMARY KEY ("id")
);
