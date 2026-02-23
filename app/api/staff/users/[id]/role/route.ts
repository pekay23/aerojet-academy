import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { UserRole, EnrollmentType } from '@prisma/client'

const updateRoleSchema = z.object({
  role: z.enum(['APPLICANT', 'STUDENT', 'INSTRUCTOR', 'STAFF', 'ADMIN']),
})

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getAuthSession()
    if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        instructorProfile: true,
        staffProfile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role === newRole) {
      return NextResponse.json({ message: 'Role is already set to ' + newRole })
    }

    // Role-specific ID generation (simplified)
    const generateId = (prefix: string) => {
      const random = Math.floor(1000 + Math.random() * 9000).toString()
      return `${prefix}-${random}`
    }

    const updatedUser = await prisma.$transaction(async (tx) => {
      // 1. Update the base role
      const updated = await tx.user.update({
        where: { id: userId },
        data: { role: newRole as UserRole },
      })

      // 2. Ensure the required profile exists for the new role
      if (newRole === 'INSTRUCTOR' && !user.instructorProfile) {
        await tx.instructorProfile.create({
          data: {
            userId,
            employeeId: generateId('IN'),
          },
        })
      } else if (['STAFF', 'ADMIN'].includes(newRole) && !user.staffProfile) {
        await tx.staffProfile.create({
          data: {
            userId,
            employeeId: generateId(newRole === 'ADMIN' ? 'AD' : 'ST'),
          },
        })
      } else if (newRole === 'STUDENT' && !user.studentProfile) {
        await tx.studentProfile.create({
          data: {
            userId,
            studentId: generateId('AATA'),
            enrollmentType: EnrollmentType.FULL_TIME,
          },
        })
      }

      return updated
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating role:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
