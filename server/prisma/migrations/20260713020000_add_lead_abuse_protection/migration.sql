ALTER TABLE "Lead"
  ADD COLUMN "normalizedEmail" TEXT,
  ADD COLUMN "normalizedPhone" TEXT,
  ADD COLUMN "idempotencyKey" TEXT;

UPDATE "Lead"
SET
  "normalizedEmail" = lower(trim("email")),
  "normalizedPhone" = NULLIF(regexp_replace(coalesce("phone", ''), '[^0-9+]', '', 'g'), '')
WHERE "normalizedEmail" IS NULL;

CREATE UNIQUE INDEX "Lead_idempotencyKey_key" ON "Lead"("idempotencyKey");
CREATE INDEX "Lead_normalizedEmail_normalizedPhone_courseId_submittedAt_idx"
  ON "Lead"("normalizedEmail", "normalizedPhone", "courseId", "submittedAt");
