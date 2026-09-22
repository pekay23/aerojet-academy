import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requirePermission, PERMISSIONS } from '@/lib/auth/permissions'
import { UserRole, EnrollmentType } from '@prisma/client'
import { sendStudentPromotionEmail } from '@/lib/email/service'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import {
  withErrorHandler,
  apiSuccess,
  apiError,
  apiForbidden,
  RouteContext,
} from '@/lib/api/response'

const updateRoleSchema = z.object({
  role: z.enum(['APPLICANT', 'STUDENT', 'EXAMINER', 'INSTRUCTOR', 'STAFF', 'ADMIN']),
})

interface RoleChangeResult {
  id: string
  role: UserRole
  generatedStudentId: string | null
}

// Select only the fields the route and its side-effect logic need.
// Deliberately excludes password, twoFactorSecret, passkeyBridgeToken,
// passwordResetToken, verifyToken, and other credential columns so no raw
// Prisma user row (including password hash) is ever returned to the caller.
const userSelect = {
  id: true,
  email: true,
  personalEmail: true,
  academyEmail: true,
  role: true,
  profile: { select: { firstName: true, lastName: true } },
  studentProfile: { select: { id: true } },
  instructorProfile: { select: { id: true } },
  staffProfile: { select: { id: true } },
} as const

export const PATCH = withErrorHandler(
  async (req: NextRequest, ctx: RouteContext<{ id: string }>) => {
    // requirePermission throws 'Unauthorized' (no session), 'Staff access
    // required' (authenticated but not staff), or 'Permission denied: <key>'
    // (staff without the grant). Translate those into standard 401/403 codes
    // instead of letting them surface as 500s.
    let actor: { id: string; role: string }
    try {
      actor = await requirePermission(PERMISSIONS.MANAGE_ROLES)
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message === 'Unauthorized') throw error
      return apiForbidden()
    }

    const { id: userId } = await ctx.params
    if (!userId) return apiError('User ID required', 400)

    let body: unknown
    try {
      body = await req.json()
    } catch {
      return apiError('Invalid JSON body', 400)
    }

    const validation = updateRoleSchema.safeParse(body)
    if (!validation.success) {
      return apiError('Invalid input', 400, { details: validation.error.format() })
    }

    const { role: newRole } = validation.data

    const user = await prismaUnfiltered.user.findUnique({
      where: { id: userId },
      select: userSelect,
    })

    if (!user) return apiError('User not found', 404)
    if (user.role === newRole) {
      return apiSuccess<RoleChangeResult>({
        id: user.id,
        role: user.role,
        generatedStudentId: null,
      })
    }

    let generatedStudentId: string | null = null

    await prismaUnfiltered.$transaction(async (tx) => {
      const generateUniqueId = async (prefix: string, type: 'STUDENT' | 'INSTRUCTOR' | 'STAFF') => {
        let isUnique = false
        let newId = ''
        while (!isUnique) {
          const random = Math.floor(1000 + Math.random() * 9000).toString()
          newId = `${prefix}-${random}`

          if (type === 'STUDENT') {
            const existing = await tx.studentProfile.findUnique({ where: { studentId: newId } })
            if (!existing) isUnique = true
          } else if (type === 'INSTRUCTOR') {
            const existing = await tx.instructorProfile.findUnique({ where: { employeeId: newId } })
            if (!existing) isUnique = true
          } else {
            const existing = await tx.staffProfile.findUnique({ where: { employeeId: newId } })
            if (!existing) isUnique = true
          }
        }
        return newId
      }

      await tx.user.update({
        where: { id: userId },
        data: { role: newRole as UserRole },
        select: { id: true, role: true },
      })

      if ((newRole === 'INSTRUCTOR' || newRole === 'EXAMINER') && !user.instructorProfile) {
        const prefix = newRole === 'EXAMINER' ? 'EX' : 'IN'
        const empId = await generateUniqueId(prefix, 'INSTRUCTOR')
        await tx.instructorProfile.create({ data: { userId, employeeId: empId } })
      } else if (['STAFF', 'ADMIN'].includes(newRole) && !user.staffProfile) {
        const prefix = newRole === 'ADMIN' ? 'AD' : 'ST'
        const empId = await generateUniqueId(prefix, 'STAFF')
        await tx.staffProfile.create({ data: { userId, employeeId: empId } })
      } else if (newRole === 'STUDENT' && !user.studentProfile) {
        const studentId = await generateUniqueId('AATA', 'STUDENT')
        generatedStudentId = studentId
        await tx.studentProfile.create({
          data: { userId, studentId, enrollmentType: EnrollmentType.FULL_TIME },
        })
      }
    })

    if (newRole === 'STUDENT' && generatedStudentId && user.email) {
      const firstName = user.profile?.firstName || 'Student'
      const targetEmail = user.academyEmail || user.personalEmail || user.email
      await sendStudentPromotionEmail(targetEmail, firstName, generatedStudentId)
    }

    await createAuditLog({
      action: AuditAction.USER_ROLE_CHANGED,
      userId: actor.id,
      targetUserId: userId,
      entity: 'User',
      entityId: userId,
      description: `Changed user role from ${user.role} to ${newRole}.`,
      changes: {
        before: { role: user.role },
        after: { role: newRole },
        generatedStudentId,
      },
    })

    return apiSuccess<RoleChangeResult>({
      id: user.id,
      role: newRole as UserRole,
      generatedStudentId,
    })
  }
)
