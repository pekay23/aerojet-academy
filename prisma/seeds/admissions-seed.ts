/**
 * Seed Script: ATA Chapters, Sample Intake Cycle, and Internal Exam Bank
 *
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' prisma/seeds/admissions-seed.ts
 * Or: npx tsx prisma/seeds/admissions-seed.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// ATA Chapter Seed Data (EASA Part-66 standard chapters)
// ---------------------------------------------------------------------------

const ATA_CHAPTERS = [
  { code: 'ATA-05', title: 'Time Limits / Maintenance Checks', category: 'AIRFRAME', sortOrder: 1 },
  { code: 'ATA-06', title: 'Dimensions and Areas', category: 'AIRFRAME', sortOrder: 2 },
  { code: 'ATA-07', title: 'Lifting and Shoring', category: 'AIRFRAME', sortOrder: 3 },
  { code: 'ATA-08', title: 'Leveling and Weighing', category: 'AIRFRAME', sortOrder: 4 },
  { code: 'ATA-09', title: 'Towing and Taxiing', category: 'AIRFRAME', sortOrder: 5 },
  { code: 'ATA-10', title: 'Parking, Mooring, Storage and Return to Service', category: 'AIRFRAME', sortOrder: 6 },
  { code: 'ATA-11', title: 'Placards and Markings', category: 'AIRFRAME', sortOrder: 7 },
  { code: 'ATA-12', title: 'Servicing', category: 'AIRFRAME', sortOrder: 8 },
  { code: 'ATA-20', title: 'Standard Practices - Airframe', category: 'AIRFRAME', sortOrder: 9 },
  { code: 'ATA-21', title: 'Air Conditioning', category: 'SYSTEMS', sortOrder: 10 },
  { code: 'ATA-22', title: 'Auto Flight', category: 'SYSTEMS', sortOrder: 11 },
  { code: 'ATA-23', title: 'Communications', category: 'SYSTEMS', sortOrder: 12 },
  { code: 'ATA-24', title: 'Electrical Power', category: 'SYSTEMS', sortOrder: 13 },
  { code: 'ATA-25', title: 'Equipment/Furnishings', category: 'SYSTEMS', sortOrder: 14 },
  { code: 'ATA-26', title: 'Fire Protection', category: 'SYSTEMS', sortOrder: 15 },
  { code: 'ATA-27', title: 'Flight Controls', category: 'SYSTEMS', sortOrder: 16 },
  { code: 'ATA-28', title: 'Fuel', category: 'SYSTEMS', sortOrder: 17 },
  { code: 'ATA-29', title: 'Hydraulic Power', category: 'SYSTEMS', sortOrder: 18 },
  { code: 'ATA-30', title: 'Ice and Rain Protection', category: 'SYSTEMS', sortOrder: 19 },
  { code: 'ATA-31', title: 'Indicating / Recording Systems', category: 'SYSTEMS', sortOrder: 20 },
  { code: 'ATA-32', title: 'Landing Gear', category: 'SYSTEMS', sortOrder: 21 },
  { code: 'ATA-33', title: 'Lights', category: 'SYSTEMS', sortOrder: 22 },
  { code: 'ATA-34', title: 'Navigation', category: 'SYSTEMS', sortOrder: 23 },
  { code: 'ATA-35', title: 'Oxygen', category: 'SYSTEMS', sortOrder: 24 },
  { code: 'ATA-36', title: 'Pneumatic', category: 'SYSTEMS', sortOrder: 25 },
  { code: 'ATA-38', title: 'Water/Waste', category: 'SYSTEMS', sortOrder: 26 },
  { code: 'ATA-49', title: 'Airborne Auxiliary Power', category: 'POWERPLANT', sortOrder: 27 },
  { code: 'ATA-51', title: 'Standard Practices and Structures', category: 'AIRFRAME', sortOrder: 28 },
  { code: 'ATA-52', title: 'Doors', category: 'AIRFRAME', sortOrder: 29 },
  { code: 'ATA-53', title: 'Fuselage', category: 'AIRFRAME', sortOrder: 30 },
  { code: 'ATA-54', title: 'Nacelles/Pylons', category: 'AIRFRAME', sortOrder: 31 },
  { code: 'ATA-55', title: 'Stabilizers', category: 'AIRFRAME', sortOrder: 32 },
  { code: 'ATA-56', title: 'Windows', category: 'AIRFRAME', sortOrder: 33 },
  { code: 'ATA-57', title: 'Wings', category: 'AIRFRAME', sortOrder: 34 },
  { code: 'ATA-70', title: 'Standard Practices - Engine', category: 'POWERPLANT', sortOrder: 35 },
  { code: 'ATA-71', title: 'Power Plant', category: 'POWERPLANT', sortOrder: 36 },
  { code: 'ATA-72', title: 'Engine - Turbine/Turboprop', category: 'POWERPLANT', sortOrder: 37 },
  { code: 'ATA-73', title: 'Engine Fuel and Control', category: 'POWERPLANT', sortOrder: 38 },
  { code: 'ATA-74', title: 'Ignition', category: 'POWERPLANT', sortOrder: 39 },
  { code: 'ATA-75', title: 'Air', category: 'POWERPLANT', sortOrder: 40 },
  { code: 'ATA-76', title: 'Engine Controls', category: 'POWERPLANT', sortOrder: 41 },
  { code: 'ATA-77', title: 'Engine Indicating', category: 'POWERPLANT', sortOrder: 42 },
  { code: 'ATA-78', title: 'Exhaust', category: 'POWERPLANT', sortOrder: 43 },
  { code: 'ATA-79', title: 'Oil', category: 'POWERPLANT', sortOrder: 44 },
  { code: 'ATA-80', title: 'Starting', category: 'POWERPLANT', sortOrder: 45 },
]

async function main() {
  console.log('🌱 Seeding admissions data...')

  // 1. Seed ATA chapters (upsert to avoid duplicates)
  console.log('  → ATA Chapters...')
  for (const ch of ATA_CHAPTERS) {
    await prisma.aTAChapter.upsert({
      where: { code: ch.code },
      update: { title: ch.title, category: ch.category as any, sortOrder: ch.sortOrder },
      create: { code: ch.code, title: ch.title, category: ch.category as any, sortOrder: ch.sortOrder },
    })
  }
  console.log(`    ✅ ${ATA_CHAPTERS.length} ATA chapters seeded`)

  // 2. Seed sample intake cycle
  console.log('  → Intake Cycle...')
  const existingCycle = await prisma.intakeCycle.findFirst({ where: { name: 'January 2026 Intake' } })
  if (!existingCycle) {
    await prisma.intakeCycle.create({
      data: {
        name: 'January 2026 Intake',
        description: 'First intake cohort of 2026',
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-03-31'),
        isActive: true,
      },
    })
    console.log('    ✅ Intake cycle created')
  } else {
    console.log('    ⏭️  Intake cycle already exists')
  }

  // 3. Seed sample internal exam bank (if courses exist)
  console.log('  → Internal Exam Banks...')
  const courses = await prisma.course.findMany({ take: 3, select: { id: true, name: true, code: true } })
  let banksCreated = 0
  for (const course of courses) {
    const existing = await prisma.internalExamBank.findFirst({ where: { courseId: course.id } })
    if (existing) continue

    const bank = await prisma.internalExamBank.create({
      data: {
        courseId: course.id,
        name: `${course.code} Module Exam`,
        description: `EASA-compliant examination for ${course.name}`,
        mcqCount: 40,
        ruleSet: 'EASA',
        minimumPoolSize: 200,
      },
    })

    // Create EASA rule override
    await prisma.internalExamRuleOverride.create({
      data: {
        bankId: bank.id,
        passMarkPct: 75,
        timePerQuestionSecs: 75,
        retakeWaitDays: 90,
        maxRetakes: 3,
        completionWindowYears: 10,
        allowKeyboardAutoSubmit: true,
      },
    })

    // Create 10 sample questions per bank
    const options = ['A', 'B', 'C']
    for (let i = 1; i <= 10; i++) {
      await prisma.internalExamQuestion.create({
        data: {
          bankId: bank.id,
          text: `Sample question ${i} for ${course.code}: What is the correct procedure for...?`,
          options: options,
          correctAnswer: options[Math.floor(Math.random() * 3)],
          subTopic: i <= 5 ? 'Fundamentals' : 'Advanced',
          difficulty: i <= 3 ? 'EASY' : i <= 7 ? 'MEDIUM' : 'HARD',
          points: 1,
        },
      })
    }

    banksCreated++
  }
  console.log(`    ✅ ${banksCreated} exam banks seeded with sample questions`)

  // 4. Seed email templates for admissions
  console.log('  → Email Templates...')
  const templates = [
    { name: 'aptitude-test-ready', subject: 'Your Aptitude Test Is Ready', body: '<p>Default body</p>' },
    { name: 'shortlisted', subject: 'You\'ve Been Shortlisted!', body: '<p>Default body</p>' },
    { name: 'interview-scheduled', subject: 'Interview Scheduled', body: '<p>Default body</p>' },
    { name: 'interview-reminder', subject: 'Interview Reminder — Tomorrow', body: '<p>Default body</p>' },
    { name: 'medical-pending', subject: 'Medical Examination Required', body: '<p>Default body</p>' },
    { name: 'medical-cleared', subject: 'Medical Cleared!', body: '<p>Default body</p>' },
    { name: 'enrolled', subject: 'Welcome to Aerojet Academy!', body: '<p>Default body</p>' },
    { name: 'rejected', subject: 'Application Update', body: '<p>Default body</p>' },
  ]

  let templatesCreated = 0
  for (const t of templates) {
    const existing = await prisma.emailTemplate.findUnique({ where: { name: t.name } })
    if (!existing) {
      await prisma.emailTemplate.create({
        data: { name: t.name, subject: t.subject, body: t.body, isActive: true },
      })
      templatesCreated++
    }
  }
  console.log(`    ✅ ${templatesCreated} email templates seeded`)

  console.log('\n🎉 Admissions seed complete!')
}

main()
  .catch(e => { console.error('Seed failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
