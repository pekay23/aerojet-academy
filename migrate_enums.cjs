const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  console.log('Migrating MODULAR to FLEXIBLE_COURSES...')
  try {
    // We use raw SQL because the Prisma Client might not recognize MODULAR anymore
    await prisma.$executeRawUnsafe(
      `UPDATE "users" SET "programmeChoice" = 'FLEXIBLE_COURSES' WHERE "programmeChoice" = 'MODULAR'`
    )
    await prisma.$executeRawUnsafe(
      `UPDATE "student_profiles" SET "enrollmentType" = 'FLEXIBLE_COURSES' WHERE "enrollmentType" = 'MODULAR'`
    )
    await prisma.$executeRawUnsafe(
      `UPDATE "student_profiles" SET "studyPathway" = 'FLEXIBLE_COURSES' WHERE "studyPathway" = 'MODULAR'`
    )
    console.log('Migration successful.')
  } catch (e) {
    console.error('Migration failed:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
