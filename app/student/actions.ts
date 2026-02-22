'use server'

import { getAuthSession, requireStudent, requireAuth } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { hash, compare } from 'bcryptjs'

export async function enrollInCourse(courseId: string) {
  const user = await requireStudent()

  // Check if already enrolled
  const existing = await prisma.enrollment.findFirst({
    where: {
      userId: user.id,
      courseId: courseId,
      status: { in: ['ACTIVE', 'ENROLLED', 'APPROVED', 'PENDING', 'SUSPENDED'] },
    },
  })

  if (existing) {
    return { error: 'You are already enrolled or have a pending enrollment for this course.' }
  }

  try {
    await prisma.enrollment.create({
      data: {
        userId: user.id,
        courseId: courseId,
        status: 'PENDING', // Default to PENDING until approved or paid
        enrolledAt: new Date(),
      },
    })
    revalidatePath('/student/courses')
    revalidatePath('/student/courses/enroll')
    return { success: true }
  } catch (error) {
    console.error('Enrollment error:', error)
    return { error: 'Failed to enroll in course.' }
  }
}

export async function joinExamPool(poolId: string) {
  const user = await requireStudent()

  // 1. Get Pool Details & Check availability
  const pool = await prisma.examPool.findUnique({
    where: { id: poolId },
    include: { event: true },
  })

  if (!pool) return { error: 'Exam pool not found.' }
  if (!['OPEN', 'NEAR_FULL'].includes(pool.status)) {
    return { error: 'This exam pool is no longer accepting new members.' }
  }
  if (pool.currentMemberCount >= pool.maxCandidates) {
    return { error: 'This exam pool is full.' }
  }

  // 2. Check if already a member
  const existingMembership = await prisma.poolMembership.findUnique({
    where: {
      poolId_userId: {
        userId: user.id,
        poolId: pool.id,
      },
    },
  })

  if (existingMembership) {
    return { error: 'You have already joined this exam pool.' }
  }

  // 3. Check Wallet Balance
  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
  const seatPrice = Number(pool.seatPrice)

  if (!wallet || Number(wallet.availableBalance) < seatPrice) {
    return {
      error: `Insufficient funds. You need ${wallet?.currency || 'EUR'} ${seatPrice} to join this pool.`,
    }
  }

  try {
    // 4. Perform Transaction (Deduct/Reserve funds + Add Membership + Update Pool Count)
    await prisma.$transaction(async (tx) => {
      // Create Reservation Transaction
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: 'RESERVE',
          amount: seatPrice,
          description: `Seat reservation for ${pool.name}`,
          metadata: { poolId: pool.id, eventId: pool.eventId },
        },
      })

      // Update Wallet Balances
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          availableBalance: { decrement: seatPrice },
          reservedBalance: { increment: seatPrice },
        },
      })

      // Create Membership
      await tx.poolMembership.create({
        data: {
          userId: user.id,
          poolId: pool.id,
          status: 'RESERVED',
          // createdAt is automatically handled by @default(now())
          selectedModule: 'PENDING', // Uses pending as default/placeholder
          amountReserved: seatPrice,
        },
      })

      // Update Pool Count
      await tx.examPool.update({
        where: { id: pool.id },
        data: {
          currentMemberCount: { increment: 1 },
          status:
            pool.currentMemberCount + 1 >= 23
              ? pool.currentMemberCount + 1 >= pool.maxCandidates
                ? 'CONFIRMED'
                : 'NEAR_FULL'
              : 'OPEN',
        },
      })
    })

    revalidatePath('/student/exam-pools')
    revalidatePath('/student/exam-pools/my-bookings')
    revalidatePath('/student/wallet')
    return { success: true }
  } catch (error) {
    console.error('Join Pool Error:', error)
    return { error: 'Failed to join exam pool. Please try again.' }
  }
}

export async function updateStudentProfile(data: {
  phone: string
  address: string
  middleName?: string
}) {
  const currentUser = await requireStudent()

  try {
    // Check if profile exists
    const dbUser = await prisma.user.findUnique({
      where: { id: currentUser.id },
      include: { profile: true },
    })

    if (!dbUser) throw new Error('User not found')

    await prisma.profile.upsert({
      where: { userId: currentUser.id },
      create: {
        userId: currentUser.id,
        firstName: currentUser.name?.split(' ')[0] || 'Unknown',
        middleName: data.middleName,
        lastName: currentUser.name?.split(' ').slice(1).join(' ') || 'User',
        phone: data.phone,
        address: data.address,
      },
      update: {
        middleName: data.middleName,
        phone: data.phone,
        address: data.address,
      },
    })
    revalidatePath('/student/profile')
    return { success: true }
  } catch (error) {
    console.error('Profile Update Error:', error)
    return { error: 'Failed to update profile.' }
  }
}

export async function changePassword(current: string, newPass: string) {
  const currentUser = await requireAuth()

  try {
    const dbUser = await prisma.user.findUnique({ where: { id: currentUser.id } })
    if (!dbUser || !dbUser.password) return { error: 'User not found or no password set.' }

    const isValid = await compare(current, dbUser.password)
    if (!isValid) return { error: 'Incorrect current password.' }

    const hashed = await hash(newPass, 12)
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { password: hashed },
    })

    return { success: true }
  } catch (error) {
    console.error('Password Change Error:', error)
    return { error: 'Failed to change password.' }
  }
}

export async function updateEmailNotifications(enabled: boolean) {
  // Mock implementation as schema support is not yet available
  // Could eventually store in a 'preferences' JSON field on User or StudentProfile
  return { success: true }
}

export async function getAvailableRecipients() {
  const session = await getAuthSession()
  if (!session) return []

  // 1. Fetch Admins
  const admins = await prisma.user.findMany({
    where: {
      role: { in: ['ADMIN', 'STAFF'] },
      status: 'ACTIVE',
    },
    select: {
      id: true,
      role: true,
      profile: {
        select: {
          firstName: true,
          lastName: true,
          profilePhotoUrl: true,
        },
      },
    },
  })

  // 2. Fetch Instructors via Enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: {
      userId: session.user.id,
      status: { in: ['ACTIVE', 'ENROLLED', 'APPROVED', 'COMPLETED'] },
    },
    include: {
      course: {
        include: {
          classes: {
            where: {
              instructorId: { not: null },
            },
            include: {
              instructor: {
                include: {
                  user: {
                    select: {
                      id: true,
                      role: true,
                      profile: {
                        select: {
                          firstName: true,
                          lastName: true,
                          profilePhotoUrl: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  // Extract unique instructors
  const instructorMap = new Map<string, any>()

  enrollments.forEach((enrollment) => {
    enrollment.course.classes.forEach((cls) => {
      if (cls.instructor && cls.instructor.user) {
        instructorMap.set(cls.instructor.user.id, cls.instructor.user)
      }
    })
  })

  const instructors = Array.from(instructorMap.values())

  // Combine and format
  const recipients = [
    ...admins.map((u: any) => ({
      id: u.id,
      label: u.profile
        ? `${u.profile.firstName} ${u.profile.lastName} (${u.role})`
        : `User ${u.id}`,
      role: u.role,
      avatarUrl: u.profile?.profilePhotoUrl,
    })),
    ...instructors.map((u: any) => ({
      id: u.id,
      label: u.profile
        ? `${u.profile.firstName} ${u.profile.lastName} (INSTRUCTOR)`
        : `Instructor ${u.id}`,
      role: 'INSTRUCTOR',
      avatarUrl: u.profile?.profilePhotoUrl,
    })),
  ]

  // Deduplicate
  const uniqueRecipients = Array.from(new Map(recipients.map((item) => [item.id, item])).values())

  return uniqueRecipients
}

export async function sendMessage(recipientId: string, subject: string, body: string) {
  try {
    const user = await requireAuth()
    const senderId = user.id

    if (!recipientId || !subject || !body) {
      return { error: 'All fields are required.' }
    }

    await prisma.message.create({
      data: {
        senderId,
        recipientId,
        subject,
        body,
        isRead: false,
      },
    })

    revalidatePath('/student/messages')
    return { success: true }
  } catch (error) {
    console.error('Send message error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return { error: `Failed to send message: ${msg}` }
  }
}

export async function markMessageAsRead(messageId: string) {
  try {
    const user = await requireAuth()
    const userId = user.id

    await prisma.message.updateMany({
      where: { id: messageId, recipientId: userId },
      data: { isRead: true, readAt: new Date() },
    })

    revalidatePath('/student/messages')
    return { success: true }
  } catch (error) {
    console.error('markMessageAsRead error:', error)
    return { error: 'Failed to mark message as read' }
  }
}
