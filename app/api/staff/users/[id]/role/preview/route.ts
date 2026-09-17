import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withErrorHandler, apiSuccess, apiError , RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requirePermission, PERMISSIONS } from '@/lib/auth/permissions'

const schema = z.object({
  role: z.enum(['APPLICANT', 'STUDENT', 'EXAMINER', 'INSTRUCTOR', 'STAFF', 'ADMIN']),
})

/**
 * Dry-run preview of a role transition. Mirrors the side-effect tree
 * computed by PATCH /api/staff/users/[id]/role without mutating anything.
 *
 * UI shows this list inside the role-change wizard so admins know exactly
 * what will happen before they click commit.
 */
export const POST = withErrorHandler(async (
  req: NextRequest, ctx?: RouteContext) => {
  await requirePermission(PERMISSIONS.MANAGE_ROLES)
  const { id: userId } = (await ctx!.params) as { id: string }
  const body = schema.parse(await req.json())
  const { role: newRole } = body

  const user = await prismaUnfiltered.user.findUnique({
    where: { id: userId },
    include: {
      studentProfile: true,
      instructorProfile: true,
      staffProfile: true,
      profile: true,
      wallet: true,
    },
  })
  if (!user) return apiError('User not found', 404)

  if (user.role === newRole) {
    return apiSuccess({
      currentRole: user.role,
      newRole,
      sideEffects: [],
      sendsEmail: false,
      warnings: ['Role is already set to ' + newRole],
    })
  }

  const sideEffects: Array<{ kind: string; description: string; targetId?: string }> = []
  const warnings: string[] = []

  // Profile creation predictions
  if ((newRole === 'INSTRUCTOR' || newRole === 'EXAMINER') && !user.instructorProfile) {
    const prefix = newRole === 'EXAMINER' ? 'EX' : 'IN'
    sideEffects.push({
      kind: 'CREATE_INSTRUCTOR_PROFILE',
      description: `Create InstructorProfile with employeeId ${prefix}-XXXX (random 4 digits)`,
    })
  }
  if (['STAFF', 'ADMIN'].includes(newRole) && !user.staffProfile) {
    const prefix = newRole === 'ADMIN' ? 'AD' : 'ST'
    sideEffects.push({
      kind: 'CREATE_STAFF_PROFILE',
      description: `Create StaffProfile with employeeId ${prefix}-XXXX (random 4 digits)`,
    })
  }
  if (newRole === 'STUDENT' && !user.studentProfile) {
    sideEffects.push({
      kind: 'CREATE_STUDENT_PROFILE',
      description: 'Create StudentProfile with studentId AATA-XXXX (random 4 digits), default enrollmentType=FULL_TIME',
    })
    if (!user.wallet) {
      sideEffects.push({
        kind: 'CREATE_WALLET',
        description: 'Create wallet (zero balance) — required for fees/credits',
      })
    }
  }

  // Email predictions
  const sendsEmail = newRole === 'STUDENT' && !!user.email
  if (sendsEmail) {
    sideEffects.push({
      kind: 'SEND_EMAIL',
      description: `Send "student promotion" email to ${user.personalEmail || user.email}`,
    })
  }

  // Demotion warnings — flag side-effects that *aren't* automated and need manual care.
  if (user.studentProfile && newRole !== 'STUDENT') {
    warnings.push('User has a StudentProfile that will be left intact. Their student ID will remain even after role change.')
  }
  if (user.staffProfile && !['STAFF', 'ADMIN'].includes(newRole)) {
    warnings.push('User has a StaffProfile (and granted permissions) — those grants are NOT auto-revoked. Review at /staff/admin/permissions.')
  }

  sideEffects.push({
    kind: 'AUDIT_LOG',
    description: `Write AuditLog row: role ${user.role} → ${newRole}`,
  })

  return apiSuccess({
    currentRole: user.role,
    newRole,
    userEmail: user.email,
    userName: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email,
    sideEffects,
    sendsEmail,
    warnings,
  })
})
