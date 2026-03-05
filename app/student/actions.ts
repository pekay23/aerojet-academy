'use server'

import { getAuthSession } from '@/lib/auth/helpers'
import {
  joinPool,
  confirmPool,
  failPool,
  getPoolWithDetails,
  getAvailablePools,
} from '@/lib/pools/operations'
import { bookStandaloneExam, bookResitExam } from '@/lib/enrollment/exams'
import prisma from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { requireAuth, requireStudent } from '@/lib/auth/helpers'
import { hash, compare } from 'bcryptjs'

export async function enrollInCourse(courseId: string) {
  const user = await requireStudent()

  // 1. Basic user status check
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { registrationPaid: true, status: true },
  })

  if (!dbUser || dbUser.status !== 'ACTIVE') {
    return { error: 'Your account is not active. Please contact support.' }
  }

  if (!dbUser.registrationPaid) {
    return {
      error:
        'Registration fee not paid. Please complete your registration payment before enrolling.',
    }
  }

  // 2. Find course details
  const course = await prisma.course.findUnique({ where: { id: courseId } })
  if (!course) return { error: 'Course not found' }

  // 3. Profile & Pathway check
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  })
  if (!profile) return { error: 'Student profile not found.' }

  if (profile.enrollmentType === 'EXAM_ONLY') {
    return {
      error:
        'Exam-Only students cannot enroll in training modules. Please contact support to change your pathway.',
    }
  }

  // 4. Check if already enrolled
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
    const coursePrice = Number(course.price)
    const isFullTime = profile.enrollmentType === 'FULL_TIME'

    // Determine if this is a "Mandatory" course for FT students
    let isMandatoryFT = false
    if (isFullTime) {
      const ftEnrollment = await prisma.fullTimeEnrollment.findFirst({
        where: { studentId: user.id, status: 'ACTIVE' },
        include: {
          programmeYear: {
            include: { courses: { select: { id: true } } },
          },
        },
      })

      if (ftEnrollment) {
        isMandatoryFT = ftEnrollment.programmeYear.courses.some((c) => c.id === courseId)
      } else {
        // Full-time student but no active programme enrollment?
        return {
          error:
            'No active Full-Time programme enrollment found. Please complete your programme activation first.',
        }
      }
    }

    // Logic for charging: Modular OR Additional Courses for FT
    const shouldCharge = profile.enrollmentType === 'MODULAR' || (isFullTime && !isMandatoryFT)

    if (shouldCharge) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })

      if (!wallet || Number(wallet.availableBalance) < coursePrice) {
        return {
          error: `Insufficient funds. Course costs ${course.currency} ${coursePrice.toFixed(2)}. Please top up your wallet.`,
        }
      }

      // We need to capture the funds directly and auto-enroll
      const { chargeWallet } = await import('@/lib/wallet/operations')

      await prisma.$transaction(async (tx) => {
        // Direct charge
        await chargeWallet(
          tx,
          user.id,
          coursePrice,
          `Enrollment in ${course.code}: ${course.name}${isFullTime ? ' (Additional)' : ''}`,
          course.id,
          'COURSE_ID'
        )

        // Create Active Enrollment
        await tx.enrollment.create({
          data: {
            userId: user.id,
            courseId: courseId,
            status: 'ACTIVE', // Auto-approved because paid in full
            enrolledAt: new Date(),
            approvedAt: new Date(),
            amountPaid: coursePrice,
          },
        })

        // Upgrade APPLICANT to STUDENT if needed
        const authUser = await tx.user.findUnique({ where: { id: user.id } })
        if (authUser?.role === 'APPLICANT') {
          await tx.user.update({
            where: { id: user.id },
            data: { role: 'STUDENT' },
          })
          await tx.studentProfile.update({
            where: { userId: user.id },
            data: { enrollmentStatus: 'ENROLLED' },
          })
        }
      })
    } else {
      // Mandatory FULL_TIME course
      await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: courseId,
          status: 'ACTIVE', // Mandatory courses are auto-active
          enrolledAt: new Date(),
          approvedAt: new Date(),
        },
      })
    }

    revalidatePath('/student/courses')
    revalidatePath('/student/courses/enroll')
    revalidatePath('/student/wallet')

    return { success: true }
  } catch (error: any) {
    console.error('Enrollment error:', error)
    return { error: error.message || 'Failed to enroll in course.' }
  }
}

export async function joinExamPool(poolId: string, moduleCode: string) {
  const user = await requireStudent()

  if (!moduleCode || moduleCode.trim() === '') {
    return { error: 'You must select a module before joining a pool.' }
  }

  // 0. Pathway Restrictions
  const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id } })
  if (profile?.enrollmentType === 'FULL_TIME') {
    return {
      error:
        'Full-Time students cannot join exam pools individually. They follow a strictly milestone-based path.',
    }
  }

  // 1. Get Pool Details & Check availability
  const pool = await prisma.examPool.findUnique({
    where: { id: poolId },
    include: {
      event: true,
      memberships: {
        where: { status: { in: ['RESERVED', 'CONFIRMED'] } },
        select: {
          examComponentId: true,
          examComponent: { select: { course: { select: { code: true } } } },
        },
      },
    },
  })

  if (!pool) return { error: 'Exam pool not found.' }
  if (!['OPEN', 'NEAR_FULL'].includes(pool.status)) {
    return { error: 'This exam pool is no longer accepting new members.' }
  }
  if (pool.currentMemberCount >= pool.maxCandidates) {
    return { error: 'This exam pool is full.' }
  }

  // 2. Module Diversity Cap — max 4 unique modules per pool
  const existingModules = pool.memberships.map((m) => m.examComponent?.course?.code).filter(Boolean)
  const uniqueModules = new Set(existingModules)
  const isNewModule = !uniqueModules.has(moduleCode)
  if (isNewModule && uniqueModules.size >= 4) {
    return {
      error: `This pool already has 4 different modules (${Array.from(uniqueModules).join(', ')}). You can only join for one of these existing modules.`,
    }
  }

  // 3. Check if already a member
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

  // 4. Time Conflict Check — no two pools on the same exam date for this user
  const examDate = new Date(pool.examDate)
  const dayStart = new Date(examDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(examDate)
  dayEnd.setHours(23, 59, 59, 999)

  const conflictingMembership = await prisma.poolMembership.findFirst({
    where: {
      userId: user.id,
      status: { in: ['RESERVED', 'CONFIRMED'] },
      pool: {
        examDate: { gte: dayStart, lte: dayEnd },
        id: { not: poolId },
      },
    },
  })

  if (conflictingMembership) {
    return {
      error:
        'You already have a booking in another pool on this exam date. Each candidate can only sit one pool per day.',
    }
  }

  // 5. Check Wallet Balance
  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
  const seatPrice = Number(pool.seatPrice)

  if (!wallet || Number(wallet.availableBalance) < seatPrice) {
    const available = Number(wallet?.availableBalance || 0)
    return {
      error: `Insufficient funds. You need €${seatPrice.toFixed(2)} but have €${available.toFixed(2)} available. Please top up your wallet.`,
    }
  }

  try {
    // 6. Perform atomic transaction
    await prisma.$transaction(async (tx) => {
      const { reserveFunds } = await import('@/lib/wallet/operations')

      // Reserve funds in wallet
      await reserveFunds(
        tx,
        user.id,
        seatPrice,
        `Seat reservation for ${pool.name} — Module ${moduleCode}`,
        pool.id,
        'POOL_ID'
      )

      const examComponent = await tx.examComponent.findFirst({
        where: { course: { code: moduleCode } },
      })

      await tx.poolMembership.create({
        data: {
          userId: user.id,
          poolId: pool.id,
          status: 'RESERVED',
          examComponentId: examComponent?.id,
          amountReserved: seatPrice,
        },
      })

      // Update Pool Count and Status
      const newCount = pool.currentMemberCount + 1
      await tx.examPool.update({
        where: { id: pool.id },
        data: {
          currentMemberCount: { increment: 1 },
          status:
            newCount >= pool.maxCandidates ? 'CONFIRMED' : newCount >= 23 ? 'NEAR_FULL' : 'OPEN',
        },
      })

      // Role Upgrade: APPLICANT → STUDENT
      if (user.role === 'APPLICANT') {
        await tx.user.update({
          where: { id: user.id },
          data: { role: 'STUDENT' },
        })
        const sp = await tx.studentProfile.findUnique({ where: { userId: user.id } })
        if (sp) {
          await tx.studentProfile.update({
            where: { userId: user.id },
            data: { enrollmentStatus: 'ENROLLED' },
          })
        }
      }
    })

    revalidatePath('/student/exam-pools')
    revalidatePath('/student/exam-pools/my-bookings')
    revalidatePath('/student/wallet')
    return { success: true }
  } catch (error) {
    console.error('Join Pool Error:', error)
    return { error: (error as Error).message || 'Failed to join exam pool. Please try again.' }
  }
}

export async function leaveExamPool(poolId: string) {
  const user = await requireStudent()

  // 1. Fetch membership
  const membership = await prisma.poolMembership.findUnique({
    where: { poolId_userId: { userId: user.id, poolId } },
    include: { pool: { include: { event: true } } },
  })

  if (!membership) {
    return { error: 'You are not a member of this pool.' }
  }

  // Students are not allowed to leave pools independently
  return {
    error:
      'Independent pool withdrawal is not permitted. Please contact administration with a valid reason to request removal.',
  }

  const refundAmount = Number(membership.amountReserved || 0)

  try {
    await prisma.$transaction(async (tx) => {
      const { releaseFunds } = await import('@/lib/wallet/operations')

      // Release reserved funds back to available
      if (refundAmount > 0) {
        await releaseFunds(
          tx,
          user.id,
          refundAmount,
          `Refund: Left pool ${membership.pool.name}`,
          poolId,
          'POOL_ID'
        )
      }

      // Cancel membership
      await tx.poolMembership.update({
        where: { poolId_userId: { userId: user.id, poolId } },
        data: { status: 'CANCELLED' },
      })

      // Decrement pool count
      const newCount = Math.max(0, membership.pool.currentMemberCount - 1)
      await tx.examPool.update({
        where: { id: poolId },
        data: {
          currentMemberCount: { decrement: 1 },
          status: newCount < 23 ? 'OPEN' : 'NEAR_FULL',
        },
      })
    })

    revalidatePath('/student/exam-pools')
    revalidatePath('/student/exam-pools/my-bookings')
    revalidatePath('/student/wallet')
    return { success: true }
  } catch (error) {
    console.error('Leave Pool Error:', error)
    return { error: (error as Error).message || 'Failed to leave pool. Please try again.' }
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

export async function bookStandaloneExamAction(examId: string) {
  try {
    const user = await requireStudent()
    await bookStandaloneExam(examId, user.id)

    revalidatePath('/student/exams')
    revalidatePath('/student/wallet')
    return { success: true }
  } catch (error: any) {
    console.error('bookStandaloneExamAction error:', error)
    return { error: error.message || 'Failed to book exam.' }
  }
}

export async function bookResitExamAction(examId: string) {
  try {
    const user = await requireStudent()
    await bookResitExam(examId, user.id)

    revalidatePath('/student/exams')
    revalidatePath('/student/wallet')
    return { success: true }
  } catch (error: any) {
    console.error('bookResitExamAction error:', error)
    return { error: error.message || 'Failed to book resit exam.' }
  }
}
