import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requirePermission, PERMISSIONS } from '@/lib/auth/permissions'
import { UserRole, EnrollmentType } from '@prisma/client'
import { sendStudentPromotionEmail } from '@/lib/email/service'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'

const updateRoleSchema = z.object({
  role: z.enum(['APPLICANT', 'STUDENT', 'EXAMINER', 'INSTRUCTOR', 'STAFF', 'ADMIN']),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requirePermission(PERMISSIONS.MANAGE_ROLES)

    const { id: userId } = await params
    const body = await req.json()
    const validation = updateRoleSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { role: newRole } = validation.data

    const user = await prismaUnfiltered.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        instructorProfile: true,
        staffProfile: true,
        profile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role === newRole) {
      return NextResponse.json({ message: 'Role is already set to ' + newRole })
    }

    let generatedStudentId: string | null = null

    const updatedUser = await prismaUnfiltered.$transaction(async (tx) => {
      // Role-specific ID generation with retry loop
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

      // 1. Update the base role
      const updated = await tx.user.update({
        where: { id: userId },
        data: { role: newRole as UserRole },
      })

      // 2. Ensure the required profile exists for the new role
      if ((newRole === 'INSTRUCTOR' || newRole === 'EXAMINER') && !user.instructorProfile) {
        const prefix = newRole === 'EXAMINER' ? 'EX' : 'IN'
        const empId = await generateUniqueId(prefix, 'INSTRUCTOR')
        await tx.instructorProfile.create({
          data: {
            userId,
            employeeId: empId,
          },
        })
      } else if (['STAFF', 'ADMIN'].includes(newRole) && !user.staffProfile) {
        const prefix = newRole === 'ADMIN' ? 'AD' : 'ST'
        const empId = await generateUniqueId(prefix, 'STAFF')
        await tx.staffProfile.create({
          data: {
            userId,
            employeeId: empId,
          },
        })
      } else if (newRole === 'STUDENT' && !user.studentProfile) {
        const studentId = await generateUniqueId('AATA', 'STUDENT')
        generatedStudentId = studentId
        await tx.studentProfile.create({
          data: {
            userId,
            studentId,
            enrollmentType: EnrollmentType.FULL_TIME,
          },
        })
      }

      return updated
    })

    // 3. Send promotion email if promoting to STUDENT
    if (newRole === 'STUDENT' && generatedStudentId && user.email) {
      const firstName = user.profile?.firstName || 'Student'
      const targetEmail = user.personalEmail || user.email
      await sendStudentPromotionEmail(targetEmail, firstName, generatedStudentId)
    }

    await createAuditLog({
      userId: session.id,
      action: AuditAction.UPDATE,
      entity: 'User',
      entityId: userId,
      description: `Changed user role from ${user.role} to ${newRole}.`,
      changes: {
        previousRole: user.role,
        newRole,
        generatedStudentId,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
