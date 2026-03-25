/**
 * Apply the same schema changes to the Supabase backup database.
 * Run: npx tsx scripts/apply-migration-supabase.ts
 */
import { Pool } from 'pg'

const pool = new Pool({
  host: 'aws-1-eu-west-1.pooler.supabase.com',
  port: 5432,
  database: 'postgres',
  user: 'postgres.actbrdmjmfnhxbscuotz',
  password: 'Morph232*234',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 15000,
})

const migrations = [
  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'DEFERRED' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'EnrollmentStatus')) THEN
      ALTER TYPE "EnrollmentStatus" ADD VALUE 'DEFERRED' AFTER 'GRADUATED';
    END IF;
  END $$;`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'FundingSource') THEN
      CREATE TYPE "FundingSource" AS ENUM ('SELF_FUNDED', 'SCHOLARSHIP', 'SPONSORED');
    END IF;
  END $$;`,

  `DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'student_profiles' AND column_name = 'fundingSource') THEN
      ALTER TABLE "student_profiles" ADD COLUMN "fundingSource" "FundingSource" NOT NULL DEFAULT 'SELF_FUNDED';
    END IF;
  END $$;`,

  `DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_userId_courseId_key') THEN
      ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_userId_courseId_key";
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_userId_courseId_semesterId_key') THEN
      ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_userId_courseId_semesterId_key" UNIQUE ("userId", "courseId", "semesterId");
    END IF;
  END $$;`,
]

async function main() {
  const client = await pool.connect()
  try {
    for (const m of migrations) {
      console.log('Executing:', m.substring(0, 80).replace(/\n/g, ' ') + '...')
      await client.query(m)
      console.log('  ✓ Done')
    }
    console.log('\nAll Supabase migrations applied successfully!')
  } catch (e: any) {
    console.error('Supabase migration failed:', e.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

main()
