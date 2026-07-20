ALTER TABLE "Lead" ADD COLUMN "courseId" TEXT;

ALTER TABLE "Lead"
ADD CONSTRAINT "Lead_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Lead_courseId_idx" ON "Lead"("courseId");
CREATE INDEX "Lead_submittedAt_idx" ON "Lead"("submittedAt");
