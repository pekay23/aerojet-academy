-- Restore deprecated columns after schema push
-- Run: psql $DATABASE_URL < scripts/restore-deprecated-columns.sql

BEGIN;

-- 1. Restore attendance_records.sessionType
UPDATE attendance_records ar
SET sessionType = b.sessionType
FROM _backup_attendance_records_sessiontype b
WHERE b.id = ar.id AND b.sessionType IS NOT NULL;

-- 2. Restore internal_exam_question_versions.difficulty
UPDATE internal_exam_question_versions qv
SET difficulty = b.difficulty
FROM _backup_question_versions_difficulty b
WHERE b.id = qv.id AND b.difficulty IS NOT NULL;

-- 3. Restore internal_exam_question_versions.changeType
UPDATE internal_exam_question_versions qv
SET changeType = b.changeType
FROM _backup_question_versions_changeType b
WHERE b.id = qv.id AND b.changeType IS NOT NULL;

COMMIT;

-- Cleanup backup tables
DROP TABLE IF EXISTS _backup_attendance_records_sessiontype;
DROP TABLE IF EXISTS _backup_question_versions_difficulty;
DROP TABLE IF EXISTS _backup_question_versions_changeType;
