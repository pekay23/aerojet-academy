#!/usr/bin/env tsx
/**
 * Migration Script: Import Existing Exam Candidates
 * ===================================================
 * Creates/updates student records, wallets, exam history, and entitlements.
 *
 * Usage:
 *   npx dotenv-cli -e .env -- tsx scripts/migrate-exam-candidates.ts
 *
 * Idempotent: safe to re-run. Uses email + migrationRef for dedupe.
 */
import { UserRole, UserStatus, TransactionType, BookingType, PaymentStatus } from '@prisma/client'
import prisma from '../lib/prisma/client'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import * as fs from 'fs'
import * as path from 'path'
import { resolveAttemptType } from '../lib/exams/attempt-types'

const MIGRATION_REF = 'EXAM_CANDIDATE_IMPORT_2026_03'

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface CandidateData {
  firstName: string
  lastName: string
  personalEmail: string
  academyEmail: string
  walletCreditEur: number
  walletNotes?: string
  examHistory: ExamHistoryEntry[]
  entitlements: EntitlementEntry[]
  plannedBookings: PlannedBookingEntry[]
}

interface ExamHistoryEntry {
  sittingLabel: string
  moduleCode: string
  bookingGroupRef: string
  bookingType: string
  attemptType: string
  result: 'pass' | 'fail'
  sourceNotes?: string
}

interface EntitlementEntry {
  bookingGroupRef: string
  bookingType: string
  includedFreeResits: number
  usedFreeResits: number
  transferable: boolean
  notes?: string
}

interface PlannedBookingEntry {
  moduleCode: string
  bookingGroupRef: string
  bookingType: string
  paymentStatus: 'paid' | 'unpaid'
  sourceNotes?: string
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function generateSecurePassword(): string {
  // 12-char password: upper, lower, digits, special
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$%&*'
  const all = upper + lower + digits + special
  const pick = (chars: string) => chars[crypto.randomInt(chars.length)]
  // Guarantee at least one of each type
  const parts = [pick(upper), pick(lower), pick(digits), pick(special)]
  for (let i = 4; i < 12; i++) parts.push(pick(all))
  // Shuffle
  for (let i = parts.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1)
    ;[parts[i], parts[j]] = [parts[j], parts[i]]
  }
  return parts.join('')
}

async function generateStudentId(): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `AATA-${year}-`
  const lastStudent = await prisma.studentProfile.findFirst({
    where: { studentId: { startsWith: prefix } },
    orderBy: { studentId: 'desc' },
    select: { studentId: true },
  })
  let nextSequence = 1
  if (lastStudent?.studentId) {
    const lastSeq = parseInt(lastStudent.studentId.replace(prefix, ''), 10)
    if (!isNaN(lastSeq)) nextSequence = lastSeq + 1
  }
  return `${prefix}${nextSequence.toString().padStart(4, '0')}`
}

// ---------------------------------------------------------------------------
// CANDIDATE DATA
// ---------------------------------------------------------------------------

const candidates: CandidateData[] = [
  {
    firstName: 'David',
    lastName: 'Archer',
    personalEmail: 'davarcher111@gmail.com',
    academyEmail: 'd.archer@aerojet-academy.com',
    walletCreditEur: 2010,
    walletNotes:
      'Historical modules: M1, M8, M2, M3, M4, M5. M4/M5 refunded. Approved wallet credit carried forward.',
    examHistory: [
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M1',
        bookingGroupRef: 'DAVID-HIST-1',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M8',
        bookingGroupRef: 'DAVID-HIST-1',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M2',
        bookingGroupRef: 'DAVID-HIST-2',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M3',
        bookingGroupRef: 'DAVID-HIST-2',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
    ],
    entitlements: [],
    plannedBookings: [],
  },
  {
    firstName: 'Abdul Wahab',
    lastName: 'Adam',
    personalEmail: 'adamwahab160@gmail.com',
    academyEmail: 'a.adam@aerojet-academy.com',
    walletCreditEur: 1340,
    walletNotes: 'Consolidated record. Intended modules: M1, M8, M2, M3.',
    examHistory: [
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M1',
        bookingGroupRef: 'ABDUL-HIST-1',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M8',
        bookingGroupRef: 'ABDUL-HIST-1',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M2',
        bookingGroupRef: 'ABDUL-HIST-2',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M3',
        bookingGroupRef: 'ABDUL-HIST-2',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
    ],
    entitlements: [],
    plannedBookings: [],
  },
  {
    firstName: 'Dzator Stanley',
    lastName: 'Korku',
    personalEmail: 'stanleykdzator@gmail.com',
    academyEmail: 'd.korku@aerojet-academy.com',
    walletCreditEur: 670,
    walletNotes: 'Intended modules: M1, M8.',
    examHistory: [
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M1',
        bookingGroupRef: 'DZATOR-HIST-1',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M8',
        bookingGroupRef: 'DZATOR-HIST-1',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
    ],
    entitlements: [],
    plannedBookings: [],
  },
  {
    firstName: 'Fred Frimpong',
    lastName: 'Ampeh',
    personalEmail: 'fredampeh@gmail.com',
    academyEmail: 'f.ampeh@aerojet-academy.com',
    walletCreditEur: 670,
    walletNotes: 'Intended modules: M2, M3.',
    examHistory: [
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M2',
        bookingGroupRef: 'FRED-HIST-1',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M3',
        bookingGroupRef: 'FRED-HIST-1',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
    ],
    entitlements: [],
    plannedBookings: [],
  },
  {
    firstName: 'Benard',
    lastName: 'Bandor',
    personalEmail: 'benardbandor@gmail.com',
    academyEmail: 'b.bandor@aerojet-academy.com',
    walletCreditEur: 3090,
    walletNotes: 'Intended modules: M1, M2, M3, M8. Admin notes: B1 & B2.',
    examHistory: [
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M1',
        bookingGroupRef: 'BENARD-HIST-1',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M8',
        bookingGroupRef: 'BENARD-HIST-1',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M2',
        bookingGroupRef: 'BENARD-HIST-2',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
      {
        sittingLabel: 'Historical Import',
        moduleCode: 'M3',
        bookingGroupRef: 'BENARD-HIST-2',
        bookingType: 'bundle',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Imported historical pass',
      },
    ],
    entitlements: [],
    plannedBookings: [],
  },
  {
    firstName: 'Edith Afi',
    lastName: 'Avege',
    personalEmail: 'puredzifa1@gmail.com',
    academyEmail: 'e.avege@aerojet-academy.com',
    walletCreditEur: 670,
    walletNotes:
      'Upcoming M2+M3 twin booking paid USD 780 = EUR 670. Historical exam history imported.',
    examHistory: [
      // Earlier sitting: twin M10+M8, both failed
      {
        sittingLabel: 'Earlier Sitting',
        moduleCode: 'M10',
        bookingGroupRef: 'EDITH-TWIN-1',
        bookingType: 'twin',
        attemptType: 'first_attempt',
        result: 'fail',
        sourceNotes: 'Twin package USD 780 — M10+M8',
      },
      {
        sittingLabel: 'Earlier Sitting',
        moduleCode: 'M8',
        bookingGroupRef: 'EDITH-TWIN-1',
        bookingType: 'twin',
        attemptType: 'first_attempt',
        result: 'fail',
        sourceNotes: 'Twin package USD 780 — M10+M8',
      },
      // Last sitting: twin M1+M9, both passed
      {
        sittingLabel: 'Last Sitting',
        moduleCode: 'M1',
        bookingGroupRef: 'EDITH-TWIN-2',
        bookingType: 'twin',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Twin package USD 780 — M1+M9',
      },
      {
        sittingLabel: 'Last Sitting',
        moduleCode: 'M9',
        bookingGroupRef: 'EDITH-TWIN-2',
        bookingType: 'twin',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Twin package USD 780 — M1+M9',
      },
      // Last sitting: M10 resit, failed
      {
        sittingLabel: 'Last Sitting',
        moduleCode: 'M10',
        bookingGroupRef: 'EDITH-TWIN-1',
        bookingType: 'twin',
        attemptType: 'resit',
        result: 'fail',
        sourceNotes: 'Resit of M10 using free resit from EDITH-TWIN-1',
      },
    ],
    entitlements: [
      {
        bookingGroupRef: 'EDITH-TWIN-1',
        bookingType: 'twin',
        includedFreeResits: 1,
        usedFreeResits: 1,
        transferable: false,
        notes: 'M10+M8 twin. Free resit used on M10 resit (failed). Exhausted.',
      },
      {
        bookingGroupRef: 'EDITH-TWIN-2',
        bookingType: 'twin',
        includedFreeResits: 1,
        usedFreeResits: 0,
        transferable: false,
        notes: 'M1+M9 twin. Free resit unused. NOT transferable to M10.',
      },
    ],
    plannedBookings: [
      {
        moduleCode: 'M2',
        bookingGroupRef: 'EDITH-TWIN-3',
        bookingType: 'twin',
        paymentStatus: 'paid',
        sourceNotes: 'Upcoming twin M2+M3, paid USD 780 = EUR 670',
      },
      {
        moduleCode: 'M3',
        bookingGroupRef: 'EDITH-TWIN-3',
        bookingType: 'twin',
        paymentStatus: 'paid',
        sourceNotes: 'Upcoming twin M2+M3, paid USD 780 = EUR 670',
      },
    ],
  },
  {
    firstName: 'Prince',
    lastName: 'Wiafe',
    personalEmail: 'prince.wiafegh@gmail.com',
    academyEmail: 'p.wiafe@aerojet-academy.com',
    walletCreditEur: 0,
    walletNotes: 'No prepaid credit. Upcoming M2+M3 not yet paid.',
    examHistory: [
      {
        sittingLabel: 'Last Sitting',
        moduleCode: 'M1',
        bookingGroupRef: 'PRINCE-TWIN-1',
        bookingType: 'twin',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Twin package USD 780 — M1+M8',
      },
      {
        sittingLabel: 'Last Sitting',
        moduleCode: 'M8',
        bookingGroupRef: 'PRINCE-TWIN-1',
        bookingType: 'twin',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Twin package USD 780 — M1+M8',
      },
    ],
    entitlements: [
      {
        bookingGroupRef: 'PRINCE-TWIN-1',
        bookingType: 'twin',
        includedFreeResits: 1,
        usedFreeResits: 0,
        transferable: false,
        notes: 'M1+M8 twin. Both passed, free resit unused.',
      },
    ],
    plannedBookings: [
      {
        moduleCode: 'M2',
        bookingGroupRef: 'PRINCE-TWIN-2',
        bookingType: 'twin',
        paymentStatus: 'unpaid',
        sourceNotes: 'Upcoming twin M2+M3 — NOT YET PAID',
      },
      {
        moduleCode: 'M3',
        bookingGroupRef: 'PRINCE-TWIN-2',
        bookingType: 'twin',
        paymentStatus: 'unpaid',
        sourceNotes: 'Upcoming twin M2+M3 — NOT YET PAID',
      },
    ],
  },
  {
    firstName: 'Ebenezer Oduro',
    lastName: 'Kwarteng',
    personalEmail: 'odurokwarteng028@gmail.com',
    academyEmail: 'e.kwarteng@aerojet-academy.com',
    walletCreditEur: 0,
    walletNotes: 'No prepaid credit. Upcoming M2+M3 not yet paid.',
    examHistory: [
      {
        sittingLabel: 'Last Sitting',
        moduleCode: 'M1',
        bookingGroupRef: 'EBENEZER-TWIN-1',
        bookingType: 'twin',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Twin package USD 780 — M1+M8',
      },
      {
        sittingLabel: 'Last Sitting',
        moduleCode: 'M8',
        bookingGroupRef: 'EBENEZER-TWIN-1',
        bookingType: 'twin',
        attemptType: 'first_attempt',
        result: 'pass',
        sourceNotes: 'Twin package USD 780 — M1+M8',
      },
    ],
    entitlements: [
      {
        bookingGroupRef: 'EBENEZER-TWIN-1',
        bookingType: 'twin',
        includedFreeResits: 1,
        usedFreeResits: 0,
        transferable: false,
        notes: 'M1+M8 twin. Both passed, free resit unused.',
      },
    ],
    plannedBookings: [
      {
        moduleCode: 'M2',
        bookingGroupRef: 'EBENEZER-TWIN-2',
        bookingType: 'twin',
        paymentStatus: 'unpaid',
        sourceNotes: 'Upcoming twin M2+M3 — NOT YET PAID',
      },
      {
        moduleCode: 'M3',
        bookingGroupRef: 'EBENEZER-TWIN-2',
        bookingType: 'twin',
        paymentStatus: 'unpaid',
        sourceNotes: 'Upcoming twin M2+M3 — NOT YET PAID',
      },
    ],
  },
]

// ---------------------------------------------------------------------------
// REPORTS
// ---------------------------------------------------------------------------

interface MigrationReport {
  created: string[]
  updated: string[]
  credentials: {
    firstName: string
    lastName: string
    email: string
    academyEmail: string
    temporaryPassword: string
    walletBalanceEur: number
    notes: string
  }[]
  wallets: { email: string; balance: number }[]
  examBookings: { email: string; module: string; result: string; type: string }[]
  errors: { email: string; error: string }[]
}

const report: MigrationReport = {
  created: [],
  updated: [],
  credentials: [],
  wallets: [],
  examBookings: [],
  errors: [],
}

// ---------------------------------------------------------------------------
// MAIN MIGRATION
// ---------------------------------------------------------------------------

async function migrateCandidate(candidate: CandidateData) {
  const {
    firstName,
    lastName,
    personalEmail,
    academyEmail,
    walletCreditEur,
    walletNotes,
    examHistory,
    entitlements,
    plannedBookings,
  } = candidate

  console.log(`\n--- Processing: ${firstName} ${lastName} (${personalEmail}) ---`)

  // Split firstName for profile (first part = firstName, rest = middleName if applicable)
  const nameParts = firstName.split(' ')
  const profileFirstName = nameParts[0]
  const profileMiddleName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null

  // Step 1: Create or update user by personal email
  let user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: personalEmail },
        { personalEmail: personalEmail },
        { academyEmail: academyEmail },
      ],
    },
    include: { profile: true, wallet: true, studentProfile: true },
  })

  const tempPassword = generateSecurePassword()
  const hashedPassword = await bcrypt.hash(tempPassword, 12)
  const isNewUser = !user

  if (!user) {
    // Create new user
    const studentId = await generateStudentId()

    user = await prisma.user.create({
      data: {
        email: academyEmail,
        personalEmail: personalEmail,
        academyEmail: academyEmail,
        password: hashedPassword,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        programmeChoice: 'EXAM_ONLY',
        mustChangePassword: true,
        passwordChanged: false,
        emailVerified: new Date(),
        registrationPaid: true,
        registrationFee: 0,
        profile: {
          create: {
            firstName: profileFirstName,
            middleName: profileMiddleName,
            lastName: lastName,
          },
        },
        studentProfile: {
          create: {
            studentId,
            enrollmentType: 'EXAM_ONLY',
            programmeChoice: 'EXAM_ONLY',
            enrollmentStatus: 'ENROLLED',
          },
        },
      },
      include: { profile: true, wallet: true, studentProfile: true },
    })
    console.log(`  CREATED user: ${user.id} (${academyEmail})`)
    report.created.push(`${firstName} ${lastName} <${personalEmail}>`)
  } else {
    // Update existing user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: academyEmail,
        personalEmail: personalEmail,
        academyEmail: academyEmail,
        password: hashedPassword,
        role: UserRole.STUDENT,
        status: UserStatus.ACTIVE,
        programmeChoice: 'EXAM_ONLY',
        // mustChangePassword preserved if user already exists
        passwordChanged: user.passwordChanged,
        emailVerified: user.emailVerified || new Date(),
        registrationPaid: true,
      },
    })

    // Ensure profile exists
    if (!user.profile) {
      await prisma.profile.create({
        data: {
          userId: user.id,
          firstName: profileFirstName,
          middleName: profileMiddleName,
          lastName: lastName,
        },
      })
    } else {
      await prisma.profile.update({
        where: { userId: user.id },
        data: {
          firstName: profileFirstName,
          middleName: profileMiddleName,
          lastName: lastName,
        },
      })
    }

    // Ensure student profile exists
    if (!user.studentProfile) {
      const studentId = await generateStudentId()
      await prisma.studentProfile.create({
        data: {
          userId: user.id,
          studentId,
          enrollmentType: 'EXAM_ONLY',
          programmeChoice: 'EXAM_ONLY',
          enrollmentStatus: 'ENROLLED',
        },
      })
    }

    // Re-fetch user with relations
    user = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { profile: true, wallet: true, studentProfile: true },
    })

    console.log(`  UPDATED user: ${user.id} (${academyEmail})`)
    report.updated.push(`${firstName} ${lastName} <${personalEmail}>`)
  }

  // Step 2: Wallet — create if not exists, set balance idempotently
  await prisma.$transaction(async (tx) => {
    let wallet = await tx.wallet.findUnique({ where: { userId: user.id } })

    if (!wallet) {
      wallet = await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          reservedBalance: 0,
          availableBalance: 0,
          currency: 'EUR',
        },
      })
    }

    // Check if migration top-up already applied
    const existingMigrationTxn = await tx.walletTransaction.findFirst({
      where: {
        walletId: wallet.id,
        referenceType: 'migration',
        referenceId: MIGRATION_REF,
      },
    })

    if (!existingMigrationTxn && walletCreditEur > 0) {
      const balanceBefore = wallet.balance.toNumber()
      const availableBefore = wallet.availableBalance.toNumber()
      const reservedBefore = wallet.reservedBalance.toNumber()

      await tx.wallet.update({
        where: { userId: user.id },
        data: {
          balance: { increment: walletCreditEur },
          availableBalance: { increment: walletCreditEur },
        },
      })

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: TransactionType.CREDIT,
          amount: walletCreditEur,
          balanceBefore,
          balanceAfter: balanceBefore + walletCreditEur,
          reservedBefore,
          reservedAfter: reservedBefore,
          availableBefore,
          availableAfter: availableBefore + walletCreditEur,
          description: `Migration import: wallet credit €${walletCreditEur}. ${walletNotes || ''}`,
          referenceType: 'migration',
          referenceId: MIGRATION_REF,
        },
      })
      console.log(`  Wallet credited: €${walletCreditEur}`)
    } else if (existingMigrationTxn) {
      console.log(`  Wallet credit already applied (idempotent skip)`)
    } else {
      console.log(`  Wallet: €0 (no credit to apply)`)
    }

    // Refresh wallet for report
    wallet = await tx.wallet.findUniqueOrThrow({ where: { userId: user.id } })
    report.wallets.push({ email: personalEmail, balance: wallet.balance.toNumber() })
  })

  // Step 3: Exam history bookings
  for (const entry of examHistory) {
    const normalizedAttempt = resolveAttemptType(entry.attemptType)
    const migRef = `${MIGRATION_REF}:${entry.bookingGroupRef}:${entry.moduleCode}:${normalizedAttempt}`

    const existing = await prisma.examBooking.findFirst({
      where: { userId: user.id, migrationRef: migRef },
    })

    if (!existing) {
      const resultToStatus = (r: string): PaymentStatus => {
        if (r === 'pass' || r === 'fail') return PaymentStatus.COMPLETED
        return PaymentStatus.PENDING
      }

      await prisma.examBooking.create({
        data: {
          userId: user.id,
          bookingType: BookingType.BUNDLE,
          moduleCode: entry.moduleCode,
          amountPaid: 0, // historical — already paid externally
          status: resultToStatus(entry.result),
          bookingGroupRef: entry.bookingGroupRef,
          attemptType: normalizedAttempt,
          result: entry.result,
          sourceNotes: `[Migration] ${entry.sittingLabel}. ${entry.sourceNotes || ''}`,
          migrationRef: migRef,
        },
      })
      console.log(`  Exam booking: ${entry.moduleCode} (${normalizedAttempt}) = ${entry.result}`)
    } else {
      console.log(
        `  Exam booking already exists: ${entry.moduleCode} (${normalizedAttempt}) — skip`
      )
    }
    // Always add to report for completeness
    report.examBookings.push({
      email: personalEmail,
      module: entry.moduleCode,
      result: entry.result,
      type: normalizedAttempt,
    })
  }

  // Step 4: Planned/upcoming bookings
  for (const planned of plannedBookings) {
    const migRef = `${MIGRATION_REF}:PLANNED:${planned.bookingGroupRef}:${planned.moduleCode}`

    const existing = await prisma.examBooking.findFirst({
      where: { userId: user.id, migrationRef: migRef },
    })

    if (!existing) {
      const paymentStatus =
        planned.paymentStatus === 'paid' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING

      await prisma.examBooking.create({
        data: {
          userId: user.id,
          bookingType: BookingType.BUNDLE,
          moduleCode: planned.moduleCode,
          amountPaid: 0,
          status: paymentStatus,
          bookingGroupRef: planned.bookingGroupRef,
          attemptType: resolveAttemptType('first_attempt'),
          result: 'pending',
          sourceNotes: `[Migration] Planned. ${planned.sourceNotes || ''}`,
          migrationRef: migRef,
        },
      })
      const label = planned.paymentStatus === 'paid' ? 'PAID/PLANNED' : 'UNPAID/PLANNED'
      console.log(`  Planned booking: ${planned.moduleCode} [${label}]`)
    } else {
      console.log(`  Planned booking already exists: ${planned.moduleCode} — skip`)
    }
    // Always add to report for completeness
    report.examBookings.push({
      email: personalEmail,
      module: planned.moduleCode,
      result: 'pending',
      type: resolveAttemptType('first_attempt'),
    })
  }

  // Step 5: Booking entitlements (free resit tracking)
  for (const ent of entitlements) {
    const existing = await prisma.bookingEntitlement.findUnique({
      where: {
        userId_bookingGroupRef: {
          userId: user.id,
          bookingGroupRef: ent.bookingGroupRef,
        },
      },
    })

    if (!existing) {
      await prisma.bookingEntitlement.create({
        data: {
          userId: user.id,
          bookingGroupRef: ent.bookingGroupRef,
          bookingType: ent.bookingType,
          includedFreeResits: ent.includedFreeResits,
          usedFreeResits: ent.usedFreeResits,
          transferable: ent.transferable,
          notes: `[Migration] ${ent.notes || ''}`,
        },
      })
      console.log(
        `  Entitlement: ${ent.bookingGroupRef} (free resits: ${ent.includedFreeResits}, used: ${ent.usedFreeResits})`
      )
    } else {
      console.log(`  Entitlement already exists: ${ent.bookingGroupRef} — skip`)
    }
  }

  // Step 6: Audit log
  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: 'IMPORT',
      entity: 'users',
      entityId: user.id,
      description: `Migration import: ${firstName} ${lastName} (${personalEmail}). ${isNewUser ? 'Created' : 'Updated'}.`,
      changes: {
        migrationRef: MIGRATION_REF,
        walletCreditEur,
        examHistoryCount: examHistory.length,
        plannedBookingsCount: plannedBookings.length,
        entitlementsCount: entitlements.length,
      },
    },
  })

  // Add to credentials report
  report.credentials.push({
    firstName,
    lastName,
    email: personalEmail,
    academyEmail,
    temporaryPassword: tempPassword,
    walletBalanceEur: walletCreditEur,
    notes: walletNotes || '',
  })
}

// ---------------------------------------------------------------------------
// GENERATE REPORTS
// ---------------------------------------------------------------------------

function generateReports() {
  const outDir = path.join(process.cwd(), 'migration-output')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  // 1. Credentials CSV (SENSITIVE — admin only)
  const credCsv = [
    'first_name,last_name,personal_email,academy_email,temporary_password,wallet_balance_eur,notes',
    ...report.credentials.map(
      (c) =>
        `"${c.firstName}","${c.lastName}","${c.email}","${c.academyEmail}","${c.temporaryPassword}",${c.walletBalanceEur},"${c.notes.replace(/"/g, '""')}"`
    ),
  ].join('\n')
  const credPath = path.join(outDir, `credentials-${timestamp}.csv`)
  fs.writeFileSync(credPath, credCsv, 'utf-8')
  console.log(`\n  Credentials report: ${credPath}`)

  // 2. Wallet balances CSV
  const walletCsv = [
    'email,balance_eur',
    ...report.wallets.map((w) => `"${w.email}",${w.balance}`),
  ].join('\n')
  const walletPath = path.join(outDir, `wallets-${timestamp}.csv`)
  fs.writeFileSync(walletPath, walletCsv, 'utf-8')
  console.log(`  Wallet report: ${walletPath}`)

  // 3. Exam history CSV
  const examCsv = [
    'email,module,result,attempt_type',
    ...report.examBookings.map((e) => `"${e.email}","${e.module}","${e.result}","${e.type}"`),
  ].join('\n')
  const examPath = path.join(outDir, `exam-history-${timestamp}.csv`)
  fs.writeFileSync(examPath, examCsv, 'utf-8')
  console.log(`  Exam history report: ${examPath}`)

  // 4. Summary JSON
  const summaryPath = path.join(outDir, `migration-summary-${timestamp}.json`)
  fs.writeFileSync(
    summaryPath,
    JSON.stringify(
      {
        migrationRef: MIGRATION_REF,
        timestamp: new Date().toISOString(),
        totalCandidates: candidates.length,
        created: report.created.length,
        updated: report.updated.length,
        errors: report.errors,
        credentialsFile: credPath,
        walletFile: walletPath,
        examHistoryFile: examPath,
      },
      null,
      2
    ),
    'utf-8'
  )
  console.log(`  Summary: ${summaryPath}`)

  // 5. Errors
  if (report.errors.length > 0) {
    const errPath = path.join(outDir, `errors-${timestamp}.json`)
    fs.writeFileSync(errPath, JSON.stringify(report.errors, null, 2), 'utf-8')
    console.log(`  Errors: ${errPath}`)
  }
}

// ---------------------------------------------------------------------------
// ENTRY POINT
// ---------------------------------------------------------------------------

async function main() {
  console.log('='.repeat(60))
  console.log('AEROJET ACADEMY — Exam Candidate Migration')
  console.log(`Migration Ref: ${MIGRATION_REF}`)
  console.log(`Date: ${new Date().toISOString()}`)
  console.log('='.repeat(60))

  for (const candidate of candidates) {
    try {
      await migrateCandidate(candidate)
    } catch (error: unknown) {
      console.error(`  ERROR processing ${candidate.personalEmail}: ${(error as Error).message}`)
      report.errors.push({ email: candidate.personalEmail, error: (error as Error).message })
    }
  }

  generateReports()

  console.log('\n' + '='.repeat(60))
  console.log('MIGRATION COMPLETE')
  console.log(`  Created: ${report.created.length}`)
  console.log(`  Updated: ${report.updated.length}`)
  console.log(`  Errors:  ${report.errors.length}`)
  console.log('='.repeat(60))
}

main().catch((e) => {
  console.error('FATAL migration error:', e)
  process.exit(1)
})
