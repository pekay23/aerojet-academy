/**
 * Apply schema changes directly via SQL since Prisma CLI
 * cannot establish SSL connections on this Windows machine.
 *
 * Uses Neon's serverless driver (WebSocket-based) to bypass TCP/SSL issues.
 *
 * Run: npx tsx scripts/apply-migration.ts
 */
import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const sql = neon('postgresql://neondb_owner:npg_XiRQ0B2IEVzC@ep-wandering-wave-ahyik1io.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require')

const migrations = [
  // 1. Add DEFERRED to EnrollmentStatus enum
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DEFERRED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EnrollmentStatus')) THEN
      ALTER TYPE "EnrollmentStatus" ADD VALUE 'DEFERRED' AFTER 'GRADUATED';
    END IF;
  END $$;`,

  // 2. Create FundingSource enum
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FundingSource') THEN
      CREATE TYPE "FundingSource" AS ENUM ('SELF_FUNDED', 'SCHOLARSHIP', 'SPONSORED');
    END IF;
  END $$;`,

  // 3. Add fundingSource column to student_profiles
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'fundingSource') THEN
      ALTER TABLE "student_profiles" ADD COLUMN "fundingSource" "FundingSource" NOT NULL DEFAULT 'SELF_FUNDED';
    END IF;
  END $$;`,

  // 4. Drop old unique constraint on enrollments(userId, courseId)
  // and create new one on (userId, courseId, semesterId)
  `DO $$ BEGIN
    -- Drop the old constraint if it exists
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_userId_courseId_key') THEN
      ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_userId_courseId_key";
    END IF;
    -- Create new constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_userId_courseId_semesterId_key') THEN
      ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_userId_courseId_semesterId_key" UNIQUE ("userId", "courseId", "semesterId");
    END IF;
  END $$;`,
]

async function main() {
  try {
    for (const migration of migrations) {
      console.log('Executing:', migration.substring(0, 80).replace(/\n/g, ' ') + '...')
      await sql.query(migration)
      console.log('  ✓ Done')
    }
    console.log('\nAll migrations applied successfully!')
  } catch (error: any) {
    console.error('Migration failed:', error.message)
    process.exit(1)
  }
}

main()
