const fs = require('fs')
if (fs.existsSync('.env.local')) {
  require('dotenv').config({ path: '.env.local' })
} else {
  require('dotenv').config()
}

const { Client } = require('pg')

async function migrate() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL
  if (!connectionString) {
    console.log('No DATABASE_URL found. Please make sure env variables are accessible')
    process.exit(1)
  }

  const client = new Client({ connectionString })

  await client.connect()
  console.log('Connected to DB')

  try {
    console.log('Adding FLEXIBLE_COURSES to enums...')
    try {
      await client.query(`ALTER TYPE "ProgrammeChoice" ADD VALUE 'FLEXIBLE_COURSES'`)
    } catch (e) {}
    try {
      await client.query(`ALTER TYPE "EnrollmentType" ADD VALUE 'FLEXIBLE_COURSES'`)
    } catch (e) {}
    try {
      await client.query(`ALTER TYPE "StudyPathway" ADD VALUE 'FLEXIBLE_COURSES'`)
    } catch (e) {}

    console.log('Updating rows...')
    await client.query(
      `UPDATE "users" SET "programmeChoice" = 'FLEXIBLE_COURSES' WHERE "programmeChoice"::text = 'MODULAR'`
    )
    await client.query(
      `UPDATE "student_profiles" SET "enrollmentType" = 'FLEXIBLE_COURSES' WHERE "enrollmentType"::text = 'MODULAR'`
    )
    await client.query(
      `UPDATE "student_profiles" SET "studyPathway" = 'FLEXIBLE_COURSES' WHERE "studyPathway"::text = 'MODULAR'`
    )

    console.log('Migration successful.')
  } catch (err) {
    console.error('Migration failed:', err)
  } finally {
    await client.end()
  }
}

migrate()
