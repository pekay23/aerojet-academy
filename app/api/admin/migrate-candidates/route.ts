import { NextRequest } from 'next/server'
import { PrismaClient, UserRole, UserStatus, TransactionType, BookingType, PaymentStatus } from '@prisma/client'
import prisma from '@/lib/prisma/client'
import { requireAdmin } from '@/lib/auth/helpers'
import { hashPassword } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiServerError, withErrorHandler } from '@/lib/api/response'
import { createAuditLog } from '@/lib/audit/logger'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface CandidateInput {
  firstName: string
  lastName: string
  personalEmail: string
  academyEmail: string
  walletCreditEur: number
  walletNotes?: string
  examHistory?: {
    sittingLabel: string
    moduleCode: string
    bookingGroupRef: string
    bookingType: string
    attemptType: 'first_attempt' | 'resit'
    result: 'pass' | 'fail'
    sourceNotes?: string
  }[]
  entitlements?: {
    bookingGroupRef: string
    bookingType: string
    includedFreeResits: number
    usedFreeResits: number
    transferable: boolean
    notes?: string
  }[]
  plannedBookings?: {
    moduleCode: string
    bookingGroupRef: string
    bookingType: string
    paymentStatus: 'paid' | 'unpaid'
    sourceNotes?: string
  }[]
}

// ---------------------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------------------

function generateSecurePassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$%&*'
  const all = upper + lower + digits + special
  const pick = (chars: string) => chars[crypto.randomInt(chars.length)]
  const parts = [pick(upper), pick(lower), pick(digits), pick(special)]
  for (let i = 4; i < 12; i++) parts.push(pick(all))
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
// POST: Run migration for provided candidates
// ---------------------------------------------------------------------------

export const POST = withErrorHandler(async (req: NextRequest) => {
  const admin = await requireAdmin()

  const body = await req.json()
  const { candidates, migrationRef } = body as {
    candidates: CandidateInput[]
    migrationRef?: string
  }

  if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
    return apiError('candidates array is required')
  }

  const ref = migrationRef || `ADMIN_IMPORT_${Date.now()}`
  const results: {
    created: string[]
    updated: string[]
    credentials: { firstName: string; lastName: string; personalEmail: string; academyEmail: string; temporaryPassword: string; walletBalanceEur: number }[]
    errors: { email: string; error: string }[]
  } = { created: [], updated: [], credentials: [], errors: [] }

  for (const candidate of candidates) {
    try {
      const {
        firstName, lastName, personalEmail, academyEmail,
        walletCreditEur, walletNotes,
        examHistory = [], entitlements = [], plannedBookings = [],
      } = candidate

      const nameParts = firstName.split(' ')
      const profileFirstName = nameParts[0]
      const profileMiddleName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : null

      const tempPassword = generateSecurePassword()
      const hashedPw = await hashPassword(tempPassword)

      // Upsert user
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

      const isNew = !user

      if (!user) {
        const studentId = await generateStudentId()
        user = await prisma.user.create({
          data: {
            email: academyEmail,
            personalEmail,
            academyEmail,
            password: hashedPw,
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
            programmeChoice: 'EXAM_ONLY',
            mustChangePassword: true,
            passwordChanged: false,
            emailVerified: new Date(),
            registrationPaid: true,
            registrationFee: 0,
            profile: {
              create: { firstName: profileFirstName, middleName: profileMiddleName, lastName },
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
        results.created.push(personalEmail)
      } else {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            email: academyEmail,
            personalEmail,
            academyEmail,
            password: hashedPw,
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
            programmeChoice: 'EXAM_ONLY',
            mustChangePassword: true,
            passwordChanged: false,
            emailVerified: user.emailVerified || new Date(),
            registrationPaid: true,
          },
        })

        if (!user.profile) {
          await prisma.profile.create({
            data: { userId: user.id, firstName: profileFirstName, middleName: profileMiddleName, lastName },
          })
        } else {
          await prisma.profile.update({
            where: { userId: user.id },
            data: { firstName: profileFirstName, middleName: profileMiddleName, lastName },
          })
        }

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

        user = await prisma.user.findUniqueOrThrow({
          where: { id: user.id },
          include: { profile: true, wallet: true, studentProfile: true },
        })
        results.updated.push(personalEmail)
      }

      // Wallet
      await prisma.$transaction(async (tx) => {
        let wallet = await tx.wallet.findUnique({ where: { userId: user.id } })
        if (!wallet) {
          wallet = await tx.wallet.create({
            data: { userId: user.id, balance: 0, reservedBalance: 0, availableBalance: 0, currency: 'EUR' },
          })
        }

        const existingTxn = await tx.walletTransaction.findFirst({
          where: { walletId: wallet.id, referenceType: 'migration', referenceId: ref },
        })

        if (!existingTxn && walletCreditEur > 0) {
          const bBefore = wallet.balance.toNumber()
          const aBefore = wallet.availableBalance.toNumber()
          const rBefore = wallet.reservedBalance.toNumber()

          await tx.wallet.update({
            where: { userId: user.id },
            data: { balance: { increment: walletCreditEur }, availableBalance: { increment: walletCreditEur } },
          })

          await tx.walletTransaction.create({
            data: {
              walletId: wallet.id,
              type: TransactionType.CREDIT,
              amount: walletCreditEur,
              balanceBefore: bBefore,
              balanceAfter: bBefore + walletCreditEur,
              reservedBefore: rBefore,
              reservedAfter: rBefore,
              availableBefore: aBefore,
              availableAfter: aBefore + walletCreditEur,
              description: `Admin import: wallet credit €${walletCreditEur}. ${walletNotes || ''}`,
              referenceType: 'migration',
              referenceId: ref,
            },
          })
        }
      })

      // Exam history
      for (const entry of examHistory) {
        const migRef = `${ref}:${entry.bookingGroupRef}:${entry.moduleCode}:${entry.attemptType}`
        const exists = await prisma.examBooking.findFirst({ where: { userId: user.id, migrationRef: migRef } })
        if (!exists) {
          await prisma.examBooking.create({
            data: {
              userId: user.id,
              bookingType: BookingType.BUNDLE,
              moduleCode: entry.moduleCode,
              amountPaid: 0,
              status: PaymentStatus.COMPLETED,
              bookingGroupRef: entry.bookingGroupRef,
              attemptType: entry.attemptType,
              result: entry.result,
              sourceNotes: `[Admin Import] ${entry.sittingLabel}. ${entry.sourceNotes || ''}`,
              migrationRef: migRef,
            },
          })
        }
      }

      // Planned bookings
      for (const planned of plannedBookings) {
        const migRef = `${ref}:PLANNED:${planned.bookingGroupRef}:${planned.moduleCode}`
        const exists = await prisma.examBooking.findFirst({ where: { userId: user.id, migrationRef: migRef } })
        if (!exists) {
          await prisma.examBooking.create({
            data: {
              userId: user.id,
              bookingType: BookingType.BUNDLE,
              moduleCode: planned.moduleCode,
              amountPaid: 0,
              status: planned.paymentStatus === 'paid' ? PaymentStatus.COMPLETED : PaymentStatus.PENDING,
              bookingGroupRef: planned.bookingGroupRef,
              attemptType: 'first_attempt',
              result: 'pending',
              sourceNotes: `[Admin Import] Planned. ${planned.sourceNotes || ''}`,
              migrationRef: migRef,
            },
          })
        }
      }

      // Entitlements
      for (const ent of entitlements) {
        const exists = await prisma.bookingEntitlement.findUnique({
          where: { userId_bookingGroupRef: { userId: user.id, bookingGroupRef: ent.bookingGroupRef } },
        })
        if (!exists) {
          await prisma.bookingEntitlement.create({
            data: {
              userId: user.id,
              bookingGroupRef: ent.bookingGroupRef,
              bookingType: ent.bookingType,
              includedFreeResits: ent.includedFreeResits,
              usedFreeResits: ent.usedFreeResits,
              transferable: ent.transferable,
              notes: `[Admin Import] ${ent.notes || ''}`,
            },
          })
        }
      }

      // Audit
      await createAuditLog({
        userId: admin.id,
        action: 'IMPORT',
        entity: 'users',
        entityId: user.id,
        description: `Admin imported candidate: ${firstName} ${lastName} (${personalEmail})`,
        changes: { migrationRef: ref, isNew, walletCreditEur },
      })

      results.credentials.push({
        firstName,
        lastName,
        personalEmail,
        academyEmail,
        temporaryPassword: tempPassword,
        walletBalanceEur: walletCreditEur,
      })
    } catch (error: any) {
      results.errors.push({ email: candidate.personalEmail, error: error.message })
    }
  }

  return apiSuccess({
    migrationRef: ref,
    summary: {
      total: candidates.length,
      created: results.created.length,
      updated: results.updated.length,
      errors: results.errors.length,
    },
    credentials: results.credentials,
    errors: results.errors,
  })
})

// ---------------------------------------------------------------------------
// GET: Fetch migration status / imported candidates
// ---------------------------------------------------------------------------

export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireAdmin()

  const { searchParams } = new URL(req.url)
  const migrationRef = searchParams.get('migrationRef')

  // Find all users imported via migration
  const migrationBookings = await prisma.examBooking.findMany({
    where: {
      migrationRef: migrationRef
        ? { startsWith: migrationRef }
        : { not: null },
    },
    select: { userId: true, migrationRef: true },
    distinct: ['userId'],
  })

  const userIds = migrationBookings.map((b) => b.userId)

  // Also find users with migration wallet transactions
  const migrationWalletTxns = await prisma.walletTransaction.findMany({
    where: { referenceType: 'migration' },
    include: { wallet: { select: { userId: true } } },
    distinct: ['walletId'],
  })

  const walletUserIds = migrationWalletTxns.map((t) => t.wallet.userId)
  const allUserIds = [...new Set([...userIds, ...walletUserIds])]

  const users = await prisma.user.findMany({
    where: { id: { in: allUserIds } },
    include: {
      profile: true,
      wallet: true,
      studentProfile: true,
      examBookings: {
        where: { migrationRef: { not: null } },
        orderBy: { createdAt: 'asc' },
      },
      bookingEntitlements: true,
    },
  })

  return apiSuccess({
    total: users.length,
    candidates: users.map((u) => ({
      id: u.id,
      name: u.profile ? `${u.profile.firstName} ${u.profile.middleName || ''} ${u.profile.lastName}`.trim() : u.email,
      personalEmail: u.personalEmail,
      academyEmail: u.academyEmail,
      status: u.status,
      walletBalance: u.wallet?.balance.toNumber() || 0,
      examBookings: u.examBookings.map((b) => ({
        moduleCode: b.moduleCode,
        attemptType: b.attemptType,
        result: b.result,
        status: b.status,
        bookingGroupRef: b.bookingGroupRef,
      })),
      entitlements: u.bookingEntitlements.map((e) => ({
        bookingGroupRef: e.bookingGroupRef,
        bookingType: e.bookingType,
        includedFreeResits: e.includedFreeResits,
        usedFreeResits: e.usedFreeResits,
        transferable: e.transferable,
      })),
    })),
  })
})
