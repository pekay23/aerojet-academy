import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler } from '@/lib/api/response'
import { updateUserSchema, validateBody } from '@/lib/validation/schemas'
import { createAuditLog } from '@/lib/audit/logger'
import { UserStatus } from '@prisma/client'

// GET /api/staff/users/[id]
export const GET = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const session = await getAuthSession()
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
      return apiError('Unauthorized', 401)
    }
    const { id } = context!.params
    if (!id) return apiError('User ID required')

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        studentProfile: true,
        instructorProfile: true,
        staffProfile: true,
        wallet: { select: { balance: true, reservedBalance: true, availableBalance: true } },
        enrollments: { include: { course: { select: { code: true, name: true } } } },
        _count: { select: { poolMemberships: true, payments: true } },
      },
    })

    if (!user) return apiNotFound('User not found')

    const { password, ...safeUser } = user
    return apiSuccess(safeUser)
  }
)

// PATCH /api/staff/users/[id]
export const PATCH = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const session = await getAuthSession()
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
      return apiError('Unauthorized', 401)
    }
    const staff = session.user
    const { id } = context!.params
    if (!id) return apiError('User ID required')

    const body = await req.json()
    const validation = updateUserSchema.safeParse(body)
    if (!validation.success) {
      const error = validation.error.issues
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ')
      return apiError(error)
    }

    const {
      firstName,
      middleName,
      lastName,
      phone,
      studentId,
      employeeId,
      nationality,
      dateOfBirth,
      profilePhotoUrl,
      ...userData
    } = validation.data

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return apiNotFound('User not found')

    // Update user fields
    const updated = await prisma.user.update({
      where: { id },
      data: userData,
    })

    // Update profile fields if provided
    if (
      firstName ||
      middleName !== undefined ||
      lastName ||
      phone ||
      nationality ||
      dateOfBirth ||
      profilePhotoUrl !== undefined
    ) {
      await prisma.profile.upsert({
        where: { userId: id },
        update: {
          ...(firstName && { firstName }),
          ...(middleName !== undefined && { middleName }),
          ...(lastName && { lastName }),
          ...(phone && { phone }),
          ...(nationality && { nationality }),
          ...(dateOfBirth && { dateOfBirth: new Date(dateOfBirth) }),
          ...(profilePhotoUrl !== undefined && { profilePhotoUrl }),
        },
        create: {
          userId: id,
          firstName: firstName || 'Unknown',
          middleName,
          lastName: lastName || 'Unknown',
          phone,
          nationality,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          profilePhotoUrl,
        },
      })
    }

    // Handle Custom ID Updates

    if (studentId && user.role === 'STUDENT') {
      const existing = await prisma.studentProfile.findUnique({ where: { studentId } })
      if (existing && existing.userId !== id) {
        return apiError('Student ID already in use', 409)
      }
      await prisma.studentProfile.update({
        where: { userId: id },
        data: { studentId },
      })
    }

    if (employeeId) {
      if (user.role === 'INSTRUCTOR') {
        const existing = await prisma.instructorProfile.findUnique({ where: { employeeId } })
        if (existing && existing.userId !== id) {
          return apiError('Employee ID already in use', 409)
        }
        await prisma.instructorProfile.update({
          where: { userId: id },
          data: { employeeId },
        })
      } else if (['ADMIN', 'STAFF', 'SUPER_ADMIN'].includes(user.role)) {
        const existing = await prisma.staffProfile.findUnique({ where: { employeeId } })
        if (existing && existing.userId !== id) {
          return apiError('Employee ID already in use', 409)
        }
        await prisma.staffProfile.update({
          where: { userId: id },
          data: { employeeId },
        })
      }
    }

    await createAuditLog({
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      userId: staff.id,
      description: `User ${user.email} updated by staff`,
      changes: validation.data,
    })

    return apiSuccess({ message: 'User updated', id: updated.id })
  }
)

// DELETE /api/staff/users/[id]
export const DELETE = withErrorHandler(
  async (req: NextRequest, context?: { params: Record<string, string> }) => {
    const session = await getAuthSession()
    if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
      return apiError('Unauthorized', 401)
    }
    const staff = session.user
    const { id } = context!.params
    if (!id) return apiError('User ID required')

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return apiNotFound('User not found')

    const { searchParams } = new URL(req.url)
    const isHardDelete = searchParams.get('hard') === 'true'

    if (isHardDelete) {
      // Permanent hard delete
      await prisma.user.delete({ where: { id } })

      await createAuditLog({
        action: 'DELETE',
        entity: 'User',
        entityId: id,
        userId: staff.id,
        description: `User ${user.email} permanently deleted by staff`,
        changes: { email: user.email, hardDelete: true },
      })

      return apiSuccess({ message: 'User permanently deleted' })
    } else {
      // Soft delete — archive
      await prisma.user.update({
        where: { id },
        data: { status: UserStatus.ARCHIVED },
      })

      await createAuditLog({
        action: 'DELETE',
        entity: 'User',
        entityId: id,
        userId: staff.id,
        description: `User ${user.email} archived by staff`,
        changes: { email: user.email, softDelete: true },
      })

      return apiSuccess({ message: 'User deactivated' })
    }
  }
)
