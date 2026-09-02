bunx.exe : Loaded Prisma config from prisma.config.ts.
At C:\Users\Pekay\AppData\Roaming\npm\bunx.ps1:14 char:3
+   & "$basedir/node_modules/bun/bin/bunx.exe"   $args
+   ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (Loaded Prisma c...isma.config.ts.:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ERROR', 'POOL_UPDATE', 'PAYMENT_UPDATE', 'EXAM_REMINDER', 'WALLET_ADJUSTMENT');
ALTER TABLE "public"."notifications" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
ALTER TABLE "notifications" ALTER COLUMN "type" SET DEFAULT 'INFO';
COMMIT;

-- DropForeignKey
ALTER TABLE "internal_exam_access_codes" DROP CONSTRAINT "internal_exam_access_codes_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "internal_exam_bank_instructors" DROP CONSTRAINT "internal_exam_bank_instructors_instructorId_fkey";

-- DropForeignKey
ALTER TABLE "internal_exam_class_schedules" DROP CONSTRAINT "internal_exam_class_schedules_classId_fkey";

-- DropForeignKey
ALTER TABLE "internal_exam_question_versions" DROP CONSTRAINT "internal_exam_question_versions_changedById_fkey";

-- DropForeignKey
ALTER TABLE "internal_exam_question_versions" DROP CONSTRAINT "internal_exam_question_versions_questionId_fkey";

-- DropForeignKey
ALTER TABLE "internal_exam_registrations" DROP CONSTRAINT "internal_exam_registrations_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "internal_exam_violations" DROP CONSTRAINT "internal_exam_violations_classId_fkey";

-- DropForeignKey
ALTER TABLE "internal_exam_violations" DROP CONSTRAINT "internal_exam_violations_studentId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_recipientId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_senderId_fkey";

-- DropIndex
DROP INDEX "certificates_certificateId_idx";

-- DropIndex
DROP INDEX "internal_exam_access_codes_code_idx";

-- DropIndex
DROP INDEX "internal_exam_bank_instructors_bankId_idx";

-- DropIndex
DROP INDEX "internal_exam_class_schedules_bankId_classId_key";

-- DropIndex
DROP INDEX "internal_exam_violations_classId_idx";

-- AlterTable
ALTER TABLE "attendance_records" DROP COLUMN "sessionType";

-- AlterTable
ALTER TABLE "audit_log_archives" ADD COLUMN     "hash" TEXT,
ADD COLUMN     "previousHash" TEXT;

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "entryHash",
ADD COLUMN     "hash" TEXT;

-- AlterTable
ALTER TABLE "certificates" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "revokeReason" TEXT,
ADD COLUMN     "revokedAt" TIMESTAMP(3),
ADD COLUMN     "revokedBy" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "sessionId" SET NOT NULL,
ALTER COLUMN "score" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "exam_results" DROP COLUMN "lockedAt",
DROP COLUMN "lockedBy",
DROP COLUMN "resultLocked";

-- AlterTable
ALTER TABLE "grades" DROP COLUMN "resultLocked";

-- AlterTable
ALTER TABLE "internal_exam_answers" DROP COLUMN "flaggedForReview";

-- AlterTable
ALTER TABLE "internal_exam_bank_instructors" ALTER COLUMN "canMonitor" SET DEFAULT false,
ALTER COLUMN "assignedBy" DROP NOT NULL;

-- AlterTable
ALTER TABLE "internal_exam_banks" ADD COLUMN     "certificateEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reviewNote" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
DROP COLUMN "reviewState",
ADD COLUMN     "reviewState" "ReviewState" NOT NULL DEFAULT 'DRAFT';

-- AlterTable
ALTER TABLE "internal_exam_questions" ADD COLUMN     "aiConfidence" DOUBLE PRECISION,
ADD COLUMN     "aiSolvedAt" TIMESTAMP(3),
ADD COLUMN     "aiSourceRef" TEXT;

-- AlterTable
ALTER TABLE "internal_exam_sessions" DROP COLUMN "questionOrder",
DROP COLUMN "sebKeys",
ADD COLUMN     "bekExpiresAt" TIMESTAMP(3),
ALTER COLUMN "timeExtensionSec" SET NOT NULL,
ALTER COLUMN "timeExtensionSec" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "internal_exam_violations" DROP COLUMN "reviewNote",
ADD COLUMN     "reviewed" BOOLEAN NOT NULL DEFAULT false,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL,
DROP COLUMN "severity",
ADD COLUMN     "severity" TEXT NOT NULL DEFAULT 'WARNING',
DROP COLUMN "reviewOutcome",
ADD COLUMN     "reviewOutcome" TEXT;

-- AlterTable
ALTER TABLE "practical_training_records" DROP COLUMN "lockedAt",
DROP COLUMN "lockedBy";

-- AlterTable
ALTER TABLE "student_license_targets" DROP COLUMN "issuedAt",
DROP COLUMN "issuedBy";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "requiresAlternativeProctoring";

-- DropTable
DROP TABLE "internal_exam_question_versions";

-- DropTable
DROP TABLE "internal_exam_registrations";

-- DropEnum
DROP TYPE "ExamViolationSeverity";

-- DropEnum
DROP TYPE "ExamViolationType";

-- DropEnum
DROP TYPE "InternalExamBankReviewState";

-- DropEnum
DROP TYPE "QuestionChangeType";

-- DropEnum
DROP TYPE "ViolationOutcome";

-- CreateIndex
CREATE INDEX "audit_log_archives_hash_idx" ON "audit_log_archives"("hash");

-- CreateIndex
CREATE INDEX "audit_logs_hash_idx" ON "audit_logs"("hash");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_sessionId_key" ON "certificates"("sessionId");

-- CreateIndex
CREATE INDEX "internal_exam_access_codes_candidateId_idx" ON "internal_exam_access_codes"("candidateId");

-- CreateIndex
CREATE INDEX "internal_exam_banks_reviewState_idx" ON "internal_exam_banks"("reviewState");

-- CreateIndex
CREATE INDEX "internal_exam_class_schedules_bankId_idx" ON "internal_exam_class_schedules"("bankId");

-- CreateIndex
CREATE INDEX "internal_exam_violations_bankId_idx" ON "internal_exam_violations"("bankId");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_exam_bank_instructors" ADD CONSTRAINT "internal_exam_bank_instructors_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "instructor_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_exam_class_schedules" ADD CONSTRAINT "internal_exam_class_schedules_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_exam_access_codes" ADD CONSTRAINT "internal_exam_access_codes_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "internal_exam_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_exam_violations" ADD CONSTRAINT "internal_exam_violations_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "internal_exam_violations" ADD CONSTRAINT "internal_exam_violations_bankId_fkey" FOREIGN KEY ("bankId") REFERENCES "internal_exam_banks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

