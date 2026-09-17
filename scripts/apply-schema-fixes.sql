-- Internal Exam UI Plan — schema fixes
-- Generated 2026-09-02 from docs/plans/internal-exam-system-ui-plan.md
-- Apply with: psql $DATABASE_URL -f scripts/apply-schema-fixes.sql

-- ─────────────────────────────────────────────────────────────────────────────
-- Task 2: InternalExamClassSchedule.class → onDelete: SetNull + classId nullable
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop existing FK, make column nullable, recreate FK with SET NULL
ALTER TABLE "internal_exam_class_schedules"
  DROP CONSTRAINT IF EXISTS "internal_exam_class_schedules_classId_fkey";

ALTER TABLE "internal_exam_class_schedules"
  ALTER COLUMN "classId" DROP NOT NULL;

ALTER TABLE "internal_exam_class_schedules"
  ADD CONSTRAINT "internal_exam_class_schedules_classId_fkey"
    FOREIGN KEY ("classId") REFERENCES "classes"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────────────────────
-- Task 3: InternalExamSession compound index (classId, status)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS "internal_exam_sessions_classId_status_idx"
  ON "internal_exam_sessions" ("classId", "status");

-- ─────────────────────────────────────────────────────────────────────────────
-- Task 4: InternalExamSession.questionOrder (paper randomization persistence)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE "internal_exam_sessions"
  ADD COLUMN IF NOT EXISTS "questionOrder" JSONB;

-- ─────────────────────────────────────────────────────────────────────────────
-- Task 5: InternalExamQuestion submittedBy / reviewedBy foreign keys
-- ─────────────────────────────────────────────────────────────────────────────

-- Fields submittedById / reviewedById already exist as String? — add FK constraints
ALTER TABLE "internal_exam_questions"
  ADD CONSTRAINT IF NOT EXISTS "internal_exam_questions_submittedById_fkey"
    FOREIGN KEY ("submittedById") REFERENCES "users"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

ALTER TABLE "internal_exam_questions"
  ADD CONSTRAINT IF NOT EXISTS "internal_exam_questions_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "users"("id")
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- Supporting indexes for the new FK columns (Postgres does not auto-index FKs)
CREATE INDEX IF NOT EXISTS "internal_exam_questions_submittedById_idx"
  ON "internal_exam_questions" ("submittedById");

CREATE INDEX IF NOT EXISTS "internal_exam_questions_reviewedById_idx"
  ON "internal_exam_questions" ("reviewedById");
