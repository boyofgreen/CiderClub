-- Member communication preferences
ALTER TABLE "Member" ADD COLUMN "eventAlertsOptIn" BOOLEAN NOT NULL DEFAULT true;

-- Editable email templates (admin overrides; code provides defaults)
CREATE TABLE "EmailTemplate" (
    "key" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailTemplate_pkey" PRIMARY KEY ("key")
);
