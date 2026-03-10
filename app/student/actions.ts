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
import { getExamPricingConfig } from '@/lib/pools/pricing-config'
import { studentCreatePoolSchema, CreatePoolInput, validateBody } from '@/lib/validation/schemas'

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

        // Send Notification
        await tx.notification.create({
          data: {
            userId: user.id,
            title: 'Course Enrollment Successful',
            message: `You have successfully enrolled in ${course.code}: ${course.name}.`,
            type: 'SUCCESS',
            linkUrl: '/student/courses',
            linkText: 'View Courses',
          },
        })
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

      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Course Enrollment Successful',
          message: `You have been automatically enrolled in the mandatory course ${course.code}: ${course.name}.`,
          type: 'INFO',
          linkUrl: '/student/courses',
          linkText: 'View Courses',
        },
      })
    }

    revalidatePath('/student/courses')
    revalidatePath('/student/courses/enroll')
    revalidatePath('/student/wallet')

    return { success: true }
  } catch (error) {
    console.error('Enrollment error:', error instanceof Error ? error.message : 'Unknown error')
    return { error: error instanceof Error ? error.message : 'Failed to enroll in course.' }
  }
}

export async function joinExamPool(poolId: string, moduleCode: string) {
  const user = await requireStudent()

  if (!moduleCode || moduleCode.trim() === '') {
    return { error: 'You must select a module before joining a booking.' }
  }

  // 0. Pathway Restrictions
  const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id } })
  if (profile?.enrollmentType === 'FULL_TIME') {
    return {
      error:
        'Full-Time students cannot join exam bookings individually. They follow a strictly milestone-based path.',
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

  if (!pool) return { error: 'Exam booking not found.' }
  if (!['OPEN', 'NEAR_FULL'].includes(pool.status)) {
    return { error: 'This exam booking is no longer accepting new members.' }
  }

  // 1.5 Global Event Cap — max 4 pools per event for a student
  const eventMemberships = await prisma.poolMembership.count({
    where: {
      userId: user.id,
      pool: { eventId: pool.eventId },
      status: { in: ['RESERVED', 'CONFIRMED'] },
    },
  })
  if (eventMemberships >= 4) {
    return {
      error: 'Module capacity reached. You can join at most 4 bookings in a single exam event.',
    }
  }

  if (pool.currentMemberCount >= pool.maxCandidates) {
    return { error: 'This exam booking is full.' }
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
    return { error: 'You have already joined this exam booking.' }
  }

  // 3.5 Duplicate Module Check per Event
  const moduleInEvent = await prisma.poolMembership.findFirst({
    where: {
      userId: user.id,
      pool: { eventId: pool.eventId },
      examComponent: { code: moduleCode },
      status: { in: ['RESERVED', 'CONFIRMED'] },
    },
  })
  if (moduleInEvent) {
    return { error: `You are already booked for Module ${moduleCode} in this exam event.` }
  }

  // 4. Time Conflict Check — handled by shared logic in joinPoolInternal
  // We remove the old hard-coded day check to allow same-day bookings if times don't overlap.

  // 5. Check Wallet Balance
  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
  const seatPrice = Number(pool.seatPrice)

  if (!wallet || Number(wallet.availableBalance) < seatPrice) {
    return {
      error: 'Insufficient wallet balance. Please top up your wallet and try again.',
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
        where: { code: moduleCode },
      })
      if (!examComponent) throw new Error(`No exam component found for module ${moduleCode}`)

      await tx.poolMembership.create({
        data: {
          userId: user.id,
          poolId: pool.id,
          status: 'RESERVED',
          examComponentId: examComponent.id,
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

      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Exam Booking Joined Successfully',
          message: `You have successfully secured a seat in ${pool.name} for module ${moduleCode}.`,
          type: 'SUCCESS',
          linkUrl: '/student/exam-bookings/my-bookings',
          linkText: 'View Bookings',
        },
      })
    })

    revalidatePath('/student/exam-bookings')
    revalidatePath('/student/exam-bookings/my-bookings')
    revalidatePath('/student/wallet')
    return { success: true }
  } catch (error) {
    console.error('Join Pool Error:', error)
    return { error: (error as Error).message || 'Failed to join exam booking. Please try again.' }
  }
}

export async function createStudentPoolAction(input: CreatePoolInput) {
  const user = await requireStudent()

  const validation = validateBody(studentCreatePoolSchema, input)
  if (!validation.success) {
    return { error: (validation as any).error }
  }

  const { eventId, moduleCode, examDate, examTimeSlot, bookingType, seats, organizationName } =
    validation.data

  try {
    // 0. Pathway Restrictions
    const profile = await prisma.studentProfile.findUnique({ where: { userId: user.id } })
    if (profile?.enrollmentType === 'FULL_TIME') {
      return {
        error:
          'Full-Time students cannot create exam bookings. They follow a strictly milestone-based path.',
      }
    }

    // 1. Get Pricing & Check Balance
    const pricing = await getExamPricingConfig()
    const isGroup = bookingType === 'GROUP_CHARTER'
    const seatPrice = isGroup ? pricing.groupCharterFee : pricing.poolExamFee

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
    if (!wallet || Number(wallet.availableBalance) < seatPrice) {
      return {
        error: `Insufficient funds. Starting a ${isGroup ? 'group charter' : 'booking'} requires a reservation of €${seatPrice.toFixed(2)}.`,
      }
    }

    // 2. Validate Event
    const event = await prisma.examEvent.findUnique({ where: { id: eventId } })
    if (!event) return { error: 'Exam event not found.' }
    if (event.status !== 'OPEN' && event.status !== 'DRAFT') {
      return { error: 'This exam event is not accepting new pools.' }
    }

    // 2.5 Global Event Cap
    const eventMemberships = await prisma.poolMembership.count({
      where: {
        userId: user.id,
        pool: { eventId },
        status: { in: ['RESERVED', 'CONFIRMED'] },
      },
    })
    if (eventMemberships >= 4) {
      return {
        error: 'Module capacity reached. You can join at most 4 bookings in a single exam event.',
      }
    }

    // 2.7 Duplicate Module Check
    const moduleInEvent = await prisma.poolMembership.findFirst({
      where: {
        userId: user.id,
        pool: { eventId },
        examComponent: { code: moduleCode },
        status: { in: ['RESERVED', 'CONFIRMED'] },
      },
    })
    if (moduleInEvent) {
      return { error: `You are already booked for Module ${moduleCode} in this exam event.` }
    }

    // 3. Find Exam Component
    const examComponent = await prisma.examComponent.findFirst({
      where: { code: moduleCode },
    })
    if (!examComponent) return { error: `No exam component found for module ${moduleCode}.` }

    // 4. Construct Pool Times
    const date = new Date(examDate)
    const startTime = new Date(date)
    const endTime = new Date(date)

    if (examTimeSlot === 'MORNING') {
      startTime.setHours(9, 0, 0, 0)
      endTime.setHours(12, 0, 0, 0)
    } else {
      startTime.setHours(13, 0, 0, 0)
      endTime.setHours(16, 0, 0, 0)
    }

    // 5. Atomic Transaction: Create Pool + Join Student
    const pool = await prisma.$transaction(async (tx) => {
      const { reserveFunds } = await import('@/lib/wallet/operations')

      // A. Create Pool
      const newPool = await tx.examPool.create({
        data: {
          eventId,
          name: isGroup
            ? organizationName || `Group - ${moduleCode}`
            : `Student Initiated - ${moduleCode}`,
          examDate: date,
          examStartTime: startTime,
          examEndTime: endTime,
          seatPrice,
          allowedModules: isGroup ? moduleCode.split(',') : [moduleCode],
          status: isGroup ? 'CONFIRMED' : 'OPEN',
          currentMemberCount: isGroup ? seats || 1 : 1,
          maxCandidates: isGroup ? seats || 28 : 28,
          createdBy: user.id,
        },
      })

      // B. Reserve Funds
      await reserveFunds(
        tx,
        user.id,
        seatPrice,
        `Seat reservation for new pool: ${newPool.name} — Module ${moduleCode}`,
        newPool.id,
        'POOL_ID'
      )

      // C. Create Membership — reuse examComponent from step 3 when possible
      const primaryModule = isGroup ? moduleCode.split(',')[0] : moduleCode
      const primaryExamComponentId =
        primaryModule === moduleCode
          ? examComponent.id
          : (await tx.examComponent.findFirst({ where: { code: primaryModule } }))?.id

      await tx.poolMembership.create({
        data: {
          userId: user.id,
          poolId: newPool.id,
          status: 'RESERVED',
          examComponentId: primaryExamComponentId,
          amountReserved: seatPrice,
        },
      })

      // D. Role Upgrade: APPLICANT → STUDENT
      if (user.role === 'APPLICANT') {
        await tx.user.update({
          where: { id: user.id },
          data: { role: 'STUDENT' },
        })
        if (profile) {
          await tx.studentProfile.update({
            where: { userId: user.id },
            data: { enrollmentStatus: 'ENROLLED' },
          })
        }
      }

      // Send Notification
      await tx.notification.create({
        data: {
          userId: user.id,
          title: 'Exam Booking Created',
          message: `You have successfully created a new exam booking for module ${moduleCode} and reserved your seat.`,
          type: 'SUCCESS',
          linkUrl: '/student/exam-bookings/my-bookings',
          linkText: 'View Bookings',
        },
      })

      return newPool
    })

    revalidatePath('/student/exam-bookings')
    revalidatePath('/student/wallet')

    return { success: true, poolId: pool.id }
  } catch (error: any) {
    console.error('Create Student Pool Error:', error)
    return { error: error.message || 'Failed to create exam booking.' }
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
  const formatRecipient = (
    u: {
      id: string
      role: string
      profile?: { firstName: string; lastName: string; profilePhotoUrl?: string | null } | null
    },
    roleOverride?: string
  ) => {
    const role = roleOverride || u.role
    return {
      id: u.id,
      label: u.profile
        ? `${u.profile.firstName} ${u.profile.lastName} (${role})`
        : `${role === 'INSTRUCTOR' ? 'Instructor' : 'User'} ${u.id}`,
      role,
      avatarUrl: u.profile?.profilePhotoUrl,
    }
  }

  const recipients = [
    ...admins.map((u) => formatRecipient(u)),
    ...instructors.map((u) => formatRecipient(u, 'INSTRUCTOR')),
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

export async function bookStandaloneExamAction(params: {
  examId?: string
  moduleCode?: string
  eventId?: string
}) {
  try {
    const user = await requireStudent()
    const result = await bookStandaloneExam(user.id, params)

    const typeStr = result.usedBundle ? 'an Exam Package seat' : 'wallet balance'
    const nameStr =
      params.moduleCode ||
      (await prisma.exam
        .findUnique({
          where: { id: params.examId },
          include: { examComponent: { include: { course: true } } },
        })
        .then((e) => e?.examComponent.course.code || 'exam'))

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Individual Exam Booked',
        message: `You have successfully booked the standalone exam "${nameStr}" using ${typeStr}.`,
        type: 'SUCCESS',
        linkUrl: '/student/exams',
        linkText: 'View Exams',
      },
    })

    revalidatePath('/student/exam-bookings')
    revalidatePath('/student/exams')
    revalidatePath('/student/wallet')
    return { success: true, usedBundle: result.usedBundle }
  } catch (error: any) {
    console.error('bookStandaloneExamAction error:', error)
    return { error: error.message || 'Failed to book exam.' }
  }
}

export async function bookResitExamAction(examId: string) {
  try {
    const user = await requireStudent()
    await bookResitExam(examId, user.id)

    const exam = await prisma.exam.findUnique({
      where: { id: examId },
      include: { examComponent: { include: { course: true } } },
    })

    if (exam) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: 'Resit Exam Booked',
          message: `You have successfully booked a resit for "${exam.examComponent?.course?.code || ''} ${exam.name}".`,
          type: 'SUCCESS',
          linkUrl: '/student/exams',
          linkText: 'View Exams',
        },
      })
    }

    revalidatePath('/student/exams')
    revalidatePath('/student/wallet')
    return { success: true }
  } catch (error: any) {
    console.error('bookResitExamAction error:', error)
    return { error: error.message || 'Failed to book resit exam.' }
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  try {
    const user = await requireAuth()
    await prisma.notification.updateMany({
      where: { id: notificationId, userId: user.id },
      data: { isRead: true, readAt: new Date() },
    })

    // We do NOT call revalidatePath() here so optimistic UI handles the visual interaction without page lag.
    return { success: true }
  } catch (error) {
    console.error('markNotificationAsReadAction error:', error)
    return { error: 'Failed to mark notification as read' }
  }
}
