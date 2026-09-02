-- Audit hash chain fields
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "previousHash" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "hash" TEXT;
CREATE INDEX IF NOT EXISTS "audit_logs_hash_idx" ON "audit_logs"("hash");

ALTER TABLE "audit_log_archives" ADD COLUMN IF NOT EXISTS "previousHash" TEXT;
ALTER TABLE "audit_log_archives" ADD COLUMN IF NOT EXISTS "hash" TEXT;
CREATE INDEX IF NOT EXISTS "audit_log_archives_hash_idx" ON "audit_log_archives"("hash");

-- InternalExamBank review state fields (if not already present)
ALTER TABLE "internal_exam_banks" ADD COLUMN IF NOT EXISTS "reviewNote" TEXT;
ALTER TABLE "internal_exam_banks" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "internal_exam_banks" ADD COLUMN IF NOT EXISTS "reviewedById" TEXT;
CREATE INDEX IF NOT EXISTS "internal_exam_banks_reviewState_idx" ON "internal_exam_banks"("reviewState");

-- Create ReviewState enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReviewState') THEN
    CREATE TYPE "ReviewState" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');
  END IF;
END
$$;
