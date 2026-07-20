ALTER TABLE "Lead" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Lead" ADD COLUMN "deletedBy" TEXT;
ALTER TABLE "Lead" ADD COLUMN "deletionReason" TEXT;

ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_deletedBy_fkey"
FOREIGN KEY ("deletedBy")
REFERENCES "AdminUser"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "Lead_deletedAt_idx" ON "Lead"("deletedAt");
CREATE INDEX "Lead_deletedBy_idx" ON "Lead"("deletedBy");

CREATE TABLE "LeadDeletionAudit" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "leadIds" JSONB,
    "courseId" TEXT,
    "courseName" TEXT,
    "reason" TEXT NOT NULL,
    "confirmation" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" "AdminRole" NOT NULL,
    "affectedCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadDeletionAudit_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LeadDeletionAudit"
ADD CONSTRAINT "LeadDeletionAudit_actorId_fkey"
FOREIGN KEY ("actorId")
REFERENCES "AdminUser"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "LeadDeletionAudit_action_createdAt_idx" ON "LeadDeletionAudit"("action", "createdAt");
CREATE INDEX "LeadDeletionAudit_actorId_createdAt_idx" ON "LeadDeletionAudit"("actorId", "createdAt");
CREATE INDEX "LeadDeletionAudit_scope_createdAt_idx" ON "LeadDeletionAudit"("scope", "createdAt");
