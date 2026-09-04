import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthSession, hashPassword } from '@/lib/auth/helpers'
import { requirePermission, PERMISSIONS } from '@/lib/auth/permissions'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { serializePrisma } from '@/lib/utils/serialization'
import { EnrollmentType } from '@prisma/client'

// Schema for user creation
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['APPLICANT', 'STUDENT', 'INSTRUCTOR', 'STAFF', 'ADMIN']),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.MANAGE_USERS)
    const _session = await getAuthSession()

    const body = await req.json()
    const validation = createUserSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.format() },
        { status: 400 }
      )
    }

    const { email, password, role, firstName, lastName, phone } = validation.data

    // Check if user already exists
    const existingUser = await prismaUnfiltered.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)

    // Create user and related profiles in a transaction
    const newUser = await prismaUnfiltered.$transaction(async (tx) => {
      // Generate random 4-digit number with collision retry
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

      // 1. Create base user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          status: 'ACTIVE', // Active by default when created by staff
          emailVerified: new Date(), // Automatically verify email for staff-created users
          mustChangePassword: true, // Require password change for temporary passwords
          profile: {
            create: {
              firstName,
              lastName,
              phone,
            },
          },
        },
        include: {
          profile: true,
        },
      })

      // 2. Create role-specific profiles
      if (role === 'INSTRUCTOR') {
        const empId = await generateUniqueId('IN', 'INSTRUCTOR')
        await tx.instructorProfile.create({
          data: {
            userId: user.id,
            employeeId: empId,
          },
        })
      } else if (role === 'STAFF') {
        const empId = await generateUniqueId('ST', 'STAFF')
        await tx.staffProfile.create({
          data: {
            userId: user.id,
            employeeId: empId,
          },
        })
      } else if (role === 'ADMIN') {
        // Admins share StaffProfile but get AD- prefix
        const empId = await generateUniqueId('AD', 'STAFF')
        await tx.staffProfile.create({
          data: {
            userId: user.id,
            employeeId: empId,
          },
        })
      } else if (role === 'STUDENT') {
        const studentId = await generateUniqueId('AATA', 'STUDENT')
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            studentId,
            enrollmentType: EnrollmentType.FULL_TIME, // Default, can be updated later
          },
        })
      }

      return user
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json(serializePrisma(userWithoutPassword), { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
