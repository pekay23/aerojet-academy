ALTER TYPE "ProgrammeChoice" ADD VALUE 'FLEXIBLE_COURSES';
ALTER TYPE "EnrollmentType" ADD VALUE 'FLEXIBLE_COURSES';
ALTER TYPE "StudyPathway" ADD VALUE 'FLEXIBLE_COURSES';

UPDATE "users" SET "programmeChoice" = 'FLEXIBLE_COURSES' WHERE "programmeChoice" = 'MODULAR';
UPDATE "student_profiles" SET "enrollmentType" = 'FLEXIBLE_COURSES' WHERE "enrollmentType" = 'MODULAR';
UPDATE "student_profiles" SET "studyPathway" = 'FLEXIBLE_COURSES' WHERE "studyPathway" = 'MODULAR';
