import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import {
  requireStaff,
  hashPassword,
  generateAcademyEmail,
  generateStudentId,
} from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { topUpWallet } from '@/lib/wallet/operations'
import {
  EnrollmentType,
  EnrollmentStatus,
  ProgrammeChoice,
  UserRole,
  UserStatus,
  BookingType,
  PaymentStatus,
  FundingSource,
} from '@prisma/client'
import crypto from 'crypto'

// ---------------------------------------------------------------------------
// TYPES
// ---------------------------------------------------------------------------

interface ImportStudent {
  // Core fields
  email: string
  firstName: string
  lastName: string
  middleName?: string
  phone?: string

  // Pathway & programme
  enrollmentType?: string // FULL_TIME, MODULAR, EXAM_ONLY, SHORT_COURSE
  programmeChoice?: string // FULL_TIME_4YEAR, FULL_TIME_2YEAR, MILITARY_1YEAR, MODULAR, EXAM_ONLY
  selectedLicenseCategories?: string[] // e.g. ['B1.1', 'B2']

  // Academy email override (if admin wants a specific one)
  academyEmail?: string

  // Wallet
  walletCreditEur?: number
  walletNotes?: string

  // Completed modules from elsewhere (module codes like M1, M2, etc.)
  completedModules?: CompletedModuleEntry[]

  // Exam history (for candidates with prior exam sittings)
  examHistory?: ExamHistoryEntry[]

  // Free resit entitlements
  entitlements?: EntitlementEntry[]

  // Planned upcoming bookings
  plannedBookings?: PlannedBookingEntry[]

  // Admin notes
  notes?: string

  // Scholarship / status
  fundingSource?: 'SELF_FUNDED' | 'SCHOLARSHIP' | 'SPONSORED'
  enrollmentStatus?: string // ACTIVE, DEFERRED, WITHDRAWN, SUSPENDED, ENROLLED
  currentYearNumber?: number
  currentSemesterNumber?: number

  // Semester-by-semester course enrollments
  semesterEnrollments?: SemesterEnrollmentEntry[]
}

interface CompletedModuleEntry {
  moduleCode: string
  result: 'pass' | 'fail'
  completedAt?: string // ISO date string
  institution?: string // where they completed it
  sourceNotes?: string
}

interface ExamHistoryEntry {
  sittingLabel: string
  moduleCode: string
  bookingGroupRef: string
  bookingType: string // twin, single, quad, etc.
  attemptType: 'first_attempt' | 'resit'
  result: 'pass' | 'fail'
  score?: number
  percentage?: number
  examDate?: string // ISO date string
  academicYearName?: string // e.g. "2024/2025" — links exam to semester
  semesterName?: string // e.g. "Semester 1"
  sourceNotes?: string
}

interface SemesterEnrollmentEntry {
  academicYearName: string // e.g. "2024/2025"
  semesterName: string // e.g. "Semester 1"
  yearNumber: number // 1, 2, 3, 4
  semesterNumber: number // 1 or 2
  courseCodes: string[] // e.g. ["M1", "M2", "M3"]
  status?: string // "COMPLETED" | "ACTIVE" | "FAILED"
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

function resolveEnrollmentType(programme: string | undefined): EnrollmentType {
  switch (programme) {
    case 'FULL_TIME_4YEAR':
    case 'FULL_TIME_2YEAR':
    case 'MILITARY_1YEAR':
      return EnrollmentType.FULL_TIME
    case 'MODULAR':
      return EnrollmentType.MODULAR
    case 'EXAM_ONLY':
      return EnrollmentType.EXAM_ONLY
    case 'SHORT_COURSE':
      return EnrollmentType.SHORT_COURSE
    default:
      return EnrollmentType.MODULAR
  }
}

function mapEnrollmentStatusToUserStatus(enrollmentStatus: string | undefined): UserStatus {
  switch (enrollmentStatus) {
    case 'SUSPENDED':
      return UserStatus.SUSPENDED
    case 'WITHDRAWN':
    case 'EXPELLED':
      return UserStatus.ARCHIVED
    default:
      return UserStatus.ACTIVE // ACTIVE, DEFERRED, ENROLLED, APPROVED, GRADUATED
  }
}

function mapProgrammeToPathwayCode(choice: string | undefined): string {
  const map: Record<string, string> = {
    FULL_TIME_4YEAR: 'FULL_TIME_4Y',
    FULL_TIME_2YEAR: 'FULL_TIME_2Y',
    MILITARY_1YEAR: 'MILITARY_1Y',
    MODULAR: 'MODULAR',
    EXAM_ONLY: 'EXAM_ONLY',
  }
  return map[choice || ''] || 'MODULAR'
}

// ---------------------------------------------------------------------------
// POST /api/staff/students/import — Enhanced bulk import
// ---------------------------------------------------------------------------

export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()
  const body = await req.json()
  const { students, migrationRef: customRef } = body as {
    students: ImportStudent[]
    migrationRef?: string
  }

  if (!Array.isArray(students) || students.length === 0) {
    return apiError('Students array is required')
  }

  const migrationRef = customRef || `STAFF_IMPORT_${Date.now()}`

  const results = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [] as string[],
    credentials: [] as {
      firstName: string
      lastName: string
      personalEmail: string
      academyEmail: string
      temporaryPassword: string
      walletBalanceEur: number
      studentId: string
      enrollmentType: string
      fundingSource: string
      enrollmentStatus: string
      notes: string
    }[],
  }

  for (const s of students) {
    try {
      // --- Validation ---
      if (!s.email || !s.firstName || !s.lastName) {
        results.errors.push(`Missing required fields for ${s.email || 'unknown'}`)
        results.skipped++
        continue
      }

      // --- Dedupe check: look up by personal email, academy email, or main email ---
      const existingUser = await prismaUnfiltered.user.findFirst({
        where: {
          OR: [
            { email: s.email },
            { personalEmail: s.email },
            ...(s.academyEmail ? [{ academyEmail: s.academyEmail }] : []),
          ],
        },
        include: { profile: true, wallet: true, studentProfile: true },
      })

      const tempPassword = generateSecurePassword()
      const hashedPassword = await hashPassword(tempPassword)

      // Resolve pathway
      const programmeChoice = (s.programmeChoice || s.enrollmentType || 'EXAM_ONLY') as string
      const enrollmentType = s.enrollmentType
        ? (s.enrollmentType as EnrollmentType)
        : resolveEnrollmentType(programmeChoice)
      const pathwayCode = mapProgrammeToPathwayCode(programmeChoice)

      let userId: string
      let finalAcademyEmail: string
      let finalStudentId: string

      if (!existingUser) {
        // ===================== CREATE NEW USER =====================
        const academyEmail =
          s.academyEmail || (await generateAcademyEmail(s.firstName, s.middleName, s.lastName))
        const studentId = await generateStudentId()

        // Look up pathway for linking
        const pathway = await prismaUnfiltered.studyPathwayModel.findUnique({
          where: { code: pathwayCode },
        })

        const user = await prismaUnfiltered.$transaction(async (tx) => {
          const newUser = await tx.user.create({
            data: {
              email: academyEmail,
              personalEmail: s.email,
              academyEmail,
              password: hashedPassword,
              role: UserRole.STUDENT,
              status: mapEnrollmentStatusToUserStatus(s.enrollmentStatus),
              programmeChoice: Object.values(ProgrammeChoice).includes(
                programmeChoice as ProgrammeChoice
              )
                ? (programmeChoice as ProgrammeChoice)
                : ProgrammeChoice.EXAM_ONLY,
              selectedLicenseCategories: s.selectedLicenseCategories || [],
              mustChangePassword: true,
              passwordChanged: false,
              emailVerified: new Date(),
              registrationPaid: true,
              registrationFee: 0,
            },
          })

          await tx.profile.create({
            data: {
              userId: newUser.id,
              firstName: s.firstName,
              lastName: s.lastName,
              middleName: s.middleName,
              phone: s.phone,
            },
          })

          const resolvedEnrollmentStatus = Object.values(EnrollmentStatus).includes(
            s.enrollmentStatus as EnrollmentStatus
          )
            ? (s.enrollmentStatus as EnrollmentStatus)
            : EnrollmentStatus.ENROLLED
          const resolvedFundingSource = Object.values(FundingSource).includes(
            s.fundingSource as unknown as FundingSource
          )
            ? (s.fundingSource as unknown as FundingSource)
            : FundingSource.SELF_FUNDED

          await tx.studentProfile.create({
            data: {
              userId: newUser.id,
              studentId,
              enrollmentType,
              programmeChoice: Object.values(ProgrammeChoice).includes(
                programmeChoice as ProgrammeChoice
              )
                ? (programmeChoice as ProgrammeChoice)
                : ProgrammeChoice.EXAM_ONLY,
              enrollmentStatus: resolvedEnrollmentStatus,
              fundingSource: resolvedFundingSource,
              pathwayId: pathway?.id ?? null,
              currentYearNumber: s.currentYearNumber || 1,
              currentSemesterNumber: s.currentSemesterNumber || 1,
            },
          })

          await tx.wallet.create({
            data: {
              userId: newUser.id,
              balance: 0,
              reservedBalance: 0,
              availableBalance: 0,
              currency: 'EUR',
            },
          })

          // Link license targets if provided
          if (s.selectedLicenseCategories && s.selectedLicenseCategories.length > 0) {
            const sp = await tx.studentProfile.findUnique({ where: { userId: newUser.id } })
            if (sp) {
              const licenseCats = await tx.licenseCategory.findMany({
                where: { code: { in: s.selectedLicenseCategories } },
              })
              if (licenseCats.length > 0) {
                await tx.studentLicenseTarget.createMany({
                  data: licenseCats.map((lc) => ({
                    studentProfileId: sp.id,
                    licenseCategoryId: lc.id,
                  })),
                  skipDuplicates: true,
                })
              }
            }
          }

          return newUser
        })

        userId = user.id
        finalAcademyEmail = academyEmail
        finalStudentId = studentId
        results.created++
      } else {
        // ===================== UPDATE EXISTING USER =====================
        const academyEmail =
          s.academyEmail ||
          existingUser.academyEmail ||
          (await generateAcademyEmail(s.firstName, s.middleName, s.lastName))
        const pathway = await prismaUnfiltered.studyPathwayModel.findUnique({
          where: { code: pathwayCode },
        })

        await prismaUnfiltered.user.update({
          where: { id: existingUser.id },
          data: {
            email: academyEmail,
            personalEmail: s.email,
            academyEmail,
            password: hashedPassword,
            role: UserRole.STUDENT,
            status: mapEnrollmentStatusToUserStatus(s.enrollmentStatus),
            programmeChoice: Object.values(ProgrammeChoice).includes(
              programmeChoice as ProgrammeChoice
            )
              ? (programmeChoice as ProgrammeChoice)
              : existingUser.programmeChoice,
            selectedLicenseCategories:
              s.selectedLicenseCategories || existingUser.selectedLicenseCategories,
            mustChangePassword: true,
            passwordChanged: false,
            emailVerified: existingUser.emailVerified || new Date(),
            registrationPaid: true,
          },
        })

        // Ensure profile
        if (existingUser.profile) {
          await prismaUnfiltered.profile.update({
            where: { userId: existingUser.id },
            data: {
              firstName: s.firstName,
              lastName: s.lastName,
              middleName: s.middleName,
              ...(s.phone && { phone: s.phone }),
            },
          })
        } else {
          await prismaUnfiltered.profile.create({
            data: {
              userId: existingUser.id,
              firstName: s.firstName,
              lastName: s.lastName,
              middleName: s.middleName,
              phone: s.phone,
            },
          })
        }

        // Ensure student profile
        const resolvedEnrollmentStatus = Object.values(EnrollmentStatus).includes(
          s.enrollmentStatus as EnrollmentStatus
        )
          ? (s.enrollmentStatus as EnrollmentStatus)
          : undefined
        const resolvedFundingSource = Object.values(FundingSource).includes(
          s.fundingSource as unknown as FundingSource
        )
          ? (s.fundingSource as unknown as FundingSource)
          : undefined

        if (!existingUser.studentProfile) {
          const studentId = await generateStudentId()
          await prismaUnfiltered.studentProfile.create({
            data: {
              userId: existingUser.id,
              studentId,
              enrollmentType,
              programmeChoice: Object.values(ProgrammeChoice).includes(
                programmeChoice as ProgrammeChoice
              )
                ? (programmeChoice as ProgrammeChoice)
                : ProgrammeChoice.EXAM_ONLY,
              enrollmentStatus: resolvedEnrollmentStatus || EnrollmentStatus.ENROLLED,
              fundingSource: resolvedFundingSource || FundingSource.SELF_FUNDED,
              pathwayId: pathway?.id ?? null,
              currentYearNumber: s.currentYearNumber || 1,
              currentSemesterNumber: s.currentSemesterNumber || 1,
            },
          })
          finalStudentId = studentId
        } else {
          // Update existing student profile
          await prismaUnfiltered.studentProfile.update({
            where: { userId: existingUser.id },
            data: {
              enrollmentType,
              ...(pathway && { pathwayId: pathway.id }),
              ...(Object.values(ProgrammeChoice).includes(programmeChoice as ProgrammeChoice) && {
                programmeChoice: programmeChoice as ProgrammeChoice,
              }),
              ...(resolvedEnrollmentStatus && { enrollmentStatus: resolvedEnrollmentStatus }),
              ...(resolvedFundingSource && { fundingSource: resolvedFundingSource }),
              ...(s.currentYearNumber && { currentYearNumber: s.currentYearNumber }),
              ...(s.currentSemesterNumber && { currentSemesterNumber: s.currentSemesterNumber }),
            },
          })
          finalStudentId = existingUser.studentProfile.studentId
        }

        // Ensure wallet
        if (!existingUser.wallet) {
          await prismaUnfiltered.wallet.create({
            data: {
              userId: existingUser.id,
              balance: 0,
              reservedBalance: 0,
              availableBalance: 0,
              currency: 'EUR',
            },
          })
        }

        userId = existingUser.id
        finalAcademyEmail = academyEmail
        results.updated++
      }

      // ===================== WALLET CREDIT =====================
      if (s.walletCreditEur && s.walletCreditEur > 0) {
        await prismaUnfiltered.$transaction(async (tx) => {
          // Idempotent: check if this migration credit was already applied
          const wallet = await tx.wallet.findUnique({ where: { userId } })
          if (!wallet) return

          const alreadyApplied = await tx.walletTransaction.findFirst({
            where: {
              walletId: wallet.id,
              referenceType: 'staff_import',
              referenceId: migrationRef,
            },
          })

          if (!alreadyApplied) {
            await topUpWallet(
              tx,
              userId,
              s.walletCreditEur!,
              `Staff import: wallet credit €${s.walletCreditEur}. ${s.walletNotes || ''}`.trim(),
              migrationRef,
              'staff_import'
            )
          }
        })
      }

      // ===================== COMPLETED MODULES =====================
      if (s.completedModules && s.completedModules.length > 0) {
        for (const mod of s.completedModules) {
          const migRef = `${migrationRef}:COMPLETED:${mod.moduleCode}`

          const existing = await prismaUnfiltered.examBooking.findFirst({
            where: { userId, migrationRef: migRef },
          })

          if (!existing) {
            await prismaUnfiltered.examBooking.create({
              data: {
                userId,
                bookingType: BookingType.INDIVIDUAL,
                moduleCode: mod.moduleCode,
                amountPaid: 0,
                status: PaymentStatus.COMPLETED,
                attemptType: 'first_attempt',
                result: mod.result,
                sourceNotes:
                  `[Import] Completed elsewhere${mod.institution ? ` at ${mod.institution}` : ''}. ${mod.sourceNotes || ''}`.trim(),
                migrationRef: migRef,
                ...(mod.completedAt && { bookedAt: new Date(mod.completedAt) }),
              },
            })
          }
        }
      }

      // ===================== EXAM HISTORY =====================
      if (s.examHistory && s.examHistory.length > 0) {
        for (const entry of s.examHistory) {
          const migRef = `${migrationRef}:${entry.bookingGroupRef}:${entry.moduleCode}:${entry.attemptType}`

          const existing = await prismaUnfiltered.examBooking.findFirst({
            where: { userId, migrationRef: migRef },
          })

          if (!existing) {
            await prismaUnfiltered.examBooking.create({
              data: {
                userId,
                bookingType: BookingType.BUNDLE,
                moduleCode: entry.moduleCode,
                amountPaid: 0,
                status: PaymentStatus.COMPLETED,
                bookingGroupRef: entry.bookingGroupRef,
                attemptType: entry.attemptType,
                result: entry.result,
                ...(entry.score != null && { score: entry.score }),
                ...(entry.percentage != null && { percentage: entry.percentage }),
                ...(entry.examDate && { examDate: new Date(entry.examDate) }),
                sourceNotes: `[Import] ${entry.sittingLabel}. ${entry.sourceNotes || ''}`.trim(),
                migrationRef: migRef,
              },
            })
          }
        }
      }

      // ===================== ENTITLEMENTS =====================
      if (s.entitlements && s.entitlements.length > 0) {
        for (const ent of s.entitlements) {
          await prismaUnfiltered.bookingEntitlement.upsert({
            where: {
              userId_bookingGroupRef: {
                userId,
                bookingGroupRef: ent.bookingGroupRef,
              },
            },
            update: {
              includedFreeResits: ent.includedFreeResits,
              usedFreeResits: ent.usedFreeResits,
              transferable: ent.transferable,
              notes: ent.notes ? `[Import] ${ent.notes}` : undefined,
            },
            create: {
              userId,
              bookingGroupRef: ent.bookingGroupRef,
              bookingType: ent.bookingType,
              includedFreeResits: ent.includedFreeResits,
              usedFreeResits: ent.usedFreeResits,
              transferable: ent.transferable,
              notes: ent.notes ? `[Import] ${ent.notes}` : undefined,
            },
          })
        }
      }

      // ===================== PLANNED BOOKINGS =====================
      if (s.plannedBookings && s.plannedBookings.length > 0) {
        for (const planned of s.plannedBookings) {
          const migRef = `${migrationRef}:PLANNED:${planned.bookingGroupRef}:${planned.moduleCode}`

          const existing = await prismaUnfiltered.examBooking.findFirst({
            where: { userId, migrationRef: migRef },
          })

          if (!existing) {
            await prismaUnfiltered.examBooking.create({
              data: {
                userId,
                bookingType: BookingType.BUNDLE,
                moduleCode: planned.moduleCode,
                amountPaid: 0,
                status:
                  planned.paymentStatus === 'paid'
                    ? PaymentStatus.COMPLETED
                    : PaymentStatus.PENDING,
                bookingGroupRef: planned.bookingGroupRef,
                attemptType: 'first_attempt',
                result: 'pending',
                sourceNotes: `[Import] Planned. ${planned.sourceNotes || ''}`.trim(),
                migrationRef: migRef,
              },
            })
          }
        }
      }

      // ===================== FULL-TIME ENROLLMENT =====================
      if (
        programmeChoice === 'FULL_TIME_4YEAR' ||
        programmeChoice === 'FULL_TIME_2YEAR' ||
        programmeChoice === 'MILITARY_1YEAR'
      ) {
        const ftCodeMap: Record<string, string> = {
          FULL_TIME_4YEAR: 'FT4Y',
          FULL_TIME_2YEAR: 'FT2Y',
          MILITARY_1YEAR: 'MIL1Y',
        }
        const ftProgramme = await prismaUnfiltered.fullTimeProgramme.findFirst({
          where: { code: ftCodeMap[programmeChoice] },
          include: { programmeYears: { orderBy: { yearNumber: 'asc' } } },
        })

        if (ftProgramme) {
          const currentYear = s.currentYearNumber || 1
          const targetProgrammeYear =
            ftProgramme.programmeYears.find((py) => py.yearNumber === currentYear) ||
            ftProgramme.programmeYears[0]

          if (targetProgrammeYear) {
            const academicYear = await prismaUnfiltered.academicYear.findFirst({
              orderBy: { startDate: 'desc' },
            })

            if (!academicYear) {
              throw new Error('No academic year configured. Please create an academic year before importing students.')
            }

            await prismaUnfiltered.fullTimeEnrollment.upsert({
              where: {
                studentId_programmeId: {
                  studentId: userId,
                  programmeId: ftProgramme.id,
                },
              },
              update: {
                currentYearNumber: currentYear,
                programmeYearId: targetProgrammeYear.id,
                academicYearId: academicYear.id,
              },
              create: {
                studentId: userId,
                programmeId: ftProgramme.id,
                programmeYearId: targetProgrammeYear.id,
                academicYearId: academicYear?.id,
                currentYearNumber: currentYear,
                status: 'ACTIVE',
                startDate: new Date(),
              },
            })
          }
        }
      }

      // ===================== SEMESTER ENROLLMENTS =====================
      if (s.semesterEnrollments && s.semesterEnrollments.length > 0) {
        for (const sem of s.semesterEnrollments) {
          // Look up academic year
          const academicYear = await prismaUnfiltered.academicYear.findFirst({
            where: { name: sem.academicYearName },
          })
          if (!academicYear) continue // Skip if academic year not configured

          // Look up semester
          const semester = await prismaUnfiltered.semester.findFirst({
            where: {
              name: sem.semesterName,
              academicYearId: academicYear.id,
            },
          })
          if (!semester) continue // Skip if semester not configured

          // Create enrollment for each course
          for (const courseCode of sem.courseCodes) {
            const course = await prismaUnfiltered.course.findFirst({
              where: { code: courseCode },
            })
            if (!course) continue

            const isCompleted = sem.status === 'COMPLETED'
            const enrollmentStatus: EnrollmentStatus = isCompleted
              ? EnrollmentStatus.ENROLLED
              : (sem.status as EnrollmentStatus) || EnrollmentStatus.ACTIVE

            // Use createMany-style idempotency: check first
            const existingEnrollment = await prismaUnfiltered.enrollment.findFirst({
              where: {
                userId,
                courseId: course.id,
                semesterId: semester.id,
              },
            })

            if (!existingEnrollment) {
              await prismaUnfiltered.enrollment.create({
                data: {
                  userId,
                  courseId: course.id,
                  academicYearId: academicYear.id,
                  semesterId: semester.id,
                  status: enrollmentStatus,
                  amountPaid: course.price,
                  enrolledAt: academicYear.startDate,
                  completedAt: isCompleted ? semester.endDate : null,
                },
              })
            }
          }
        }
      }

      // ===================== AUDIT =====================
      await createAuditLog({
        action: AuditAction.IMPORT,
        entity: 'users',
        entityId: userId,
        userId: staff.id,
        description: `Staff imported student: ${s.firstName} ${s.lastName} (${s.email})`,
        changes: {
          migrationRef,
          isNew: !existingUser,
          enrollmentType: enrollmentType,
          programmeChoice,
          walletCreditEur: s.walletCreditEur || 0,
          completedModulesCount: s.completedModules?.length || 0,
          examHistoryCount: s.examHistory?.length || 0,
          plannedBookingsCount: s.plannedBookings?.length || 0,
        },
      })

      // Fetch final wallet balance
      const finalWallet = await prismaUnfiltered.wallet.findUnique({ where: { userId } })

      results.credentials.push({
        firstName: s.firstName,
        lastName: s.lastName,
        personalEmail: s.email,
        academyEmail: finalAcademyEmail,
        temporaryPassword: tempPassword,
        walletBalanceEur: finalWallet?.balance.toNumber() || 0,
        studentId: finalStudentId,
        enrollmentType: enrollmentType,
        fundingSource: s.fundingSource || 'SELF_FUNDED',
        enrollmentStatus: s.enrollmentStatus || 'ENROLLED',
        notes: s.notes || '',
      })
    } catch (error: unknown) {
      results.errors.push(`${s.email}: ${error instanceof Error ? error.message : String(error)}`)
      results.skipped++
    }
  }

  await createAuditLog({
    action: AuditAction.IMPORT,
    entity: 'StudentBulkImport',
    userId: staff.id,
    description: `Bulk student import: ${results.created} created, ${results.updated} updated, ${results.skipped} skipped`,
    changes: {
      migrationRef,
      total: students.length,
      created: results.created,
      updated: results.updated,
      skipped: results.skipped,
      errorCount: results.errors.length,
    },
  })

  return apiSuccess({
    migrationRef,
    summary: {
      total: students.length,
      created: results.created,
      updated: results.updated,
      skipped: results.skipped,
      errors: results.errors.length,
    },
    credentials: results.credentials.map(({ ...rest }) => rest),
    errors: results.errors,
  })
})
