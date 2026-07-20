CREATE TABLE "AdminActionAudit" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorRole" "AdminRole" NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "method" TEXT,
    "path" TEXT,
    "requestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminActionAudit_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "AdminActionAudit"
ADD CONSTRAINT "AdminActionAudit_actorId_fkey"
FOREIGN KEY ("actorId")
REFERENCES "AdminUser"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;

CREATE INDEX "AdminActionAudit_actorId_createdAt_idx" ON "AdminActionAudit"("actorId", "createdAt");
CREATE INDEX "AdminActionAudit_action_createdAt_idx" ON "AdminActionAudit"("action", "createdAt");
CREATE INDEX "AdminActionAudit_resource_resourceId_idx" ON "AdminActionAudit"("resource", "resourceId");
