#!/usr/bin/env tsx
/**
 * Bulk generate student IDs for users missing them
 * Usage: npx tsx scripts/generate-student-ids.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const year = new Date().getFullYear()
  const prefix = `AJA-${year}-`

  // Find highest existing sequence
  const last = await prisma.studentProfile.findFirst({
    where: { studentId: { startsWith: prefix } },
    orderBy: { studentId: 'desc' },
  })

  let nextSeq = 1
  if (last) {
    const seq = parseInt(last.studentId.replace(prefix, ''), 10)
    if (!isNaN(seq)) nextSeq = seq + 1
  }

  // Find students without student IDs
  const students = await prisma.user.findMany({
    where: { role: 'STUDENT', studentProfile: null },
    include: { profile: true },
  })

  console.log(`Found ${students.length} students without profiles`)

  for (const student of students) {
    const studentId = `${prefix}${nextSeq.toString().padStart(4, '0')}`
    await prisma.studentProfile.create({
      data: {
        userId: student.id,
        studentId,
        enrollmentDate: new Date(),
        enrollmentType: 'MODULAR', // Defaulting
      },
    })
    // studentId is not on the user model anymore, it's on studentProfile
    console.log(`  ${student.profile?.firstName} ${student.profile?.lastName} → ${studentId}`)
    nextSeq++
  }

  console.log(`✅ Generated ${students.length} student IDs`)
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
