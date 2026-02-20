import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAuthSession, hashPassword } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { UserRole, EnrollmentType } from '@prisma/client'

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
    const session = await getAuthSession()

    // Check if user is authenticated
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add stricter role checks here if needed (e.g. only ADMIN can create STAFF/ADMIN)

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
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    const hashedPassword = await hashPassword(password)

    // Generate random 4-digit number
    const generateId = (prefix: string) => {
      const random = Math.floor(1000 + Math.random() * 9000).toString()
      return `${prefix}-${random}`
    }

    // Create user and related profiles in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // 1. Create base user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          status: 'ACTIVE', // Active by default when created by staff
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
        await tx.instructorProfile.create({
          data: {
            userId: user.id,
            employeeId: generateId('IN'),
          },
        })
      } else if (role === 'STAFF') {
        await tx.staffProfile.create({
          data: {
            userId: user.id,
            employeeId: generateId('ST'),
          },
        })
      } else if (role === 'ADMIN') {
        // Admins share StaffProfile but get AD- prefix
        await tx.staffProfile.create({
          data: {
            userId: user.id,
            employeeId: generateId('AD'),
          },
        })
      } else if (role === 'STUDENT') {
        await tx.studentProfile.create({
          data: {
            userId: user.id,
            studentId: generateId('AATA'),
            enrollmentType: EnrollmentType.FULL_TIME, // Default, can be updated later
          },
        })
      }

      return user
    })

    // Return user without password
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json(userWithoutPassword, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

