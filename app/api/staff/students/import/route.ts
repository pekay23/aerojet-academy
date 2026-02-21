import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import {
  requireStaff,
  hashPassword,
  generateTempPassword,
  generateAcademyEmail,
  generateStudentId,
} from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { EnrollmentType, UserRole, UserStatus } from '@prisma/client'

// POST /api/staff/students/import — Bulk import students from CSV data
export const POST = withErrorHandler(async (req: NextRequest) => {
  const staff = await requireStaff()
  const body = await req.json()
  const { students } = body

  if (!Array.isArray(students) || students.length === 0) {
    return apiError('Students array is required')
  }

  const results = { created: 0, skipped: 0, errors: [] as string[] }

  for (const s of students) {
    try {
      if (!s.email || !s.firstName || !s.lastName) {
        results.errors.push(`Missing required fields for ${s.email || 'unknown'}`)
        results.skipped++
        continue
      }

      const existing = await prisma.user.findUnique({ where: { email: s.email } })
      if (existing) {
        results.errors.push(`${s.email} already exists`)
        results.skipped++
        continue
      }

      const tempPassword = generateTempPassword()
      const hashedPassword = await hashPassword(tempPassword)
      const academyEmail = generateAcademyEmail(s.firstName, s.middleName, s.lastName)
      const studentId = generateStudentId()

      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: academyEmail,
            personalEmail: s.email,
            academyEmail,
            password: hashedPassword,
            role: UserRole.STUDENT,
            status: UserStatus.ACTIVE,
            mustChangePassword: true,
            registrationPaid: true,
          },
        })

        await tx.profile.create({
          data: {
            userId: user.id,
            firstName: s.firstName,
            lastName: s.lastName,
            middleName: s.middleName,
            phone: s.phone,
          },
        })

        await tx.studentProfile.create({
          data: {
            userId: user.id,
            studentId,
            enrollmentType: (s.enrollmentType as EnrollmentType) || EnrollmentType.MODULAR,
          },
        })

        await tx.wallet.create({
          data: { userId: user.id, balance: 0, reservedBalance: 0, availableBalance: 0 },
        })
      })

      results.created++
    } catch (error: any) {
      results.errors.push(`${s.email}: ${error.message}`)
      results.skipped++
    }
  }

  await createAuditLog({
    action: AuditAction.IMPORT,
    entity: 'StudentImport',
    userId: staff.id,
    details: { total: students.length, created: results.created, skipped: results.skipped },
  })

  return apiSuccess(results)
})
