/**
 * Fix Admin Notes Migration
 *
 * Re-applies admin notes for the 8 migrated students.
 * Only updates adminNotes — no wallet or exam changes.
 *
 * Run with: npx dotenv-cli -e .env -- tsx prisma/fix-admin-notes.ts
 */

import prisma from '../lib/prisma/client'

const STUDENTS = [
  {
    email: 'd.archer@aerojet-academy.com',
    name: 'David Archer',
    adminNote: 'Historical intended modules: M1, M2, M3, M4, M5, M8. M4 and M5 were refunded.',
  },
  {
    email: 'a.adam@aerojet-academy.com',
    name: 'Abdul Wahab Adam',
    adminNote: 'Historical intended modules: M1, M2, M3, M8. Consolidated from earlier records.',
  },
  {
    email: 'd.korku@aerojet-academy.com',
    name: 'Dzator Stanley Korku',
    adminNote: 'Historical intended modules: M1, M8',
  },
  {
    email: 'f.ampeh@aerojet-academy.com',
    name: 'Fred Frimpong Ampeh',
    adminNote: 'Historical intended modules: M2, M3',
  },
  {
    email: 'b.bandor@aerojet-academy.com',
    name: 'Bernard Bandor',
    adminNote: 'Historical intended modules: M1, M2, M3, M8. License intentions: B1 & B2 (add as admin notes only).',
  },
  {
    email: 'e.avege@aerojet-academy.com',
    name: 'Edith Afi Avege',
    adminNote: 'Earlier sitting: Twin pack M8+M10, failed both. Free resit used on M10, failed resit. Last sitting: Twin pack M1+M9, passed both. Intended next: M2, M3 twin booking. Wallet €670 reserved for M2,M3.',
  },
  {
    email: 'p.wiafe@aerojet-academy.com',
    name: 'Prince Wiafe',
    adminNote: 'Last sitting: Twin pack M1+M8, passed both. Intended next: M2, M3. No wallet funds.',
  },
  {
    email: 'e.kwarteng@aerojet-academy.com',
    name: 'Ebenezer Oduro Kwarteng',
    adminNote: 'Last sitting: Twin pack M1+M8, passed both. Intended next: M2, M3. No wallet funds.',
  },
]

async function main() {
  console.log('=== Fix Admin Notes Migration ===\n')

  let success = 0
  let failed = 0

  for (const student of STUDENTS) {
    try {
      const user = await prisma.user.findFirst({
        where: { email: student.email },
        select: { id: true, studentProfile: { select: { adminNotes: true } } },
      })

      if (!user) {
        console.log(`  ✗ ${student.name} (${student.email}) — user not found`)
        failed++
        continue
      }

      if (!user.studentProfile) {
        console.log(`  ✗ ${student.name} — no student profile`)
        failed++
        continue
      }

      const existing = user.studentProfile.adminNotes
      if (existing && existing.trim().length > 0) {
        console.log(`  ○ ${student.name} — already has notes: "${existing.substring(0, 50)}..."`)
        success++
        continue
      }

      await prisma.studentProfile.update({
        where: { userId: user.id },
        data: { adminNotes: student.adminNote },
      })

      console.log(`  ✓ ${student.name} — notes saved: "${student.adminNote.substring(0, 50)}..."`)
      success++
    } catch (error: any) {
      console.log(`  ✗ ${student.name} — error: ${error.message}`)
      failed++
    }
  }

  console.log(`\n=== Done: ${success} success, ${failed} failed ===`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
