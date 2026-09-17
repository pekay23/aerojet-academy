-- Backup deprecated columns before schema push
-- Run: psql $DATABASE_URL < scripts/backup-deprecated-columns.sql
-- Restore with: psql $DATABASE_URL < scripts/restore-deprecated-columns.sql

BEGIN;

-- 1. attendance_records.sessionType
CREATE TABLE IF NOT EXISTS _backup_attendance_records_sessiontype AS
SELECT id, sessionType FROM attendance_records WHERE sessionType IS NOT NULL;

-- 2. internal_exam_question_versions.difficulty
CREATE TABLE IF NOT EXISTS _backup_question_versions_difficulty AS
SELECT id, difficulty FROM internal_exam_question_versions WHERE difficulty IS NOT NULL;

-- 3. internal_exam_question_versions.changeType
CREATE TABLE IF NOT EXISTS _backup_question_versions_changeType AS
SELECT id, changeType FROM internal_exam_question_versions WHERE changeType IS NOT NULL;

COMMIT;
