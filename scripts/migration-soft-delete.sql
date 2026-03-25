-- Migration: Add soft-delete (deletedAt) to key models
-- Apply to both Neon (primary) and Supabase (backup)

-- AdminNote
ALTER TABLE "admin_notes" ADD COLUMN "deletedAt" TIMESTAMP;
CREATE INDEX "admin_notes_deletedAt_idx" ON "admin_notes"("deletedAt");

-- Enrollment
ALTER TABLE "enrollments" ADD COLUMN "deletedAt" TIMESTAMP;
CREATE INDEX "enrollments_deletedAt_idx" ON "enrollments"("deletedAt");

-- Grade
ALTER TABLE "grades" ADD COLUMN "deletedAt" TIMESTAMP;
CREATE INDEX "grades_deletedAt_idx" ON "grades"("deletedAt");

-- ExamEvent
ALTER TABLE "exam_events" ADD COLUMN "deletedAt" TIMESTAMP;
CREATE INDEX "exam_events_deletedAt_idx" ON "exam_events"("deletedAt");

-- PoolMembership
ALTER TABLE "pool_memberships" ADD COLUMN "deletedAt" TIMESTAMP;
CREATE INDEX "pool_memberships_deletedAt_idx" ON "pool_memberships"("deletedAt");

-- ExamBooking
ALTER TABLE "exam_bookings" ADD COLUMN "deletedAt" TIMESTAMP;
CREATE INDEX "exam_bookings_deletedAt_idx" ON "exam_bookings"("deletedAt");
