'use server'

import { Prisma } from '@prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { joinPool } from '@/lib/pools/operations'
import {
  bookStandaloneExam,
  bookResitExam,
  placeExamBookingInStandardPool,
} from '@/lib/enrollment/exams'
import prisma from '@/lib/prisma/client'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { revalidatePath } from 'next/cache'

import {
  UserStatus,
  UserRole,
  EnrollmentStatus,
  PoolStatus,
  MembershipStatus,
  PaymentStatus,
} from '@/types/enums'

import { requireAuth, requireStudent } from '@/lib/auth/helpers'
import { hash, compare } from 'bcryptjs'
import { getExamPricingConfig } from '@/lib/pools/pricing-config'
import { studentCreatePoolSchema, CreatePoolInput, validateBody } from '@/lib/validation/schemas'
import { assertExamOnlyPathway } from '@/lib/pools/access-control'
import { resolveEffectiveEnrollmentType } from '@/lib/enrollment/pathway'
import { chargeWallet } from '@/lib/wallet/operations'
import { categoryMatchesTarget, getStudentTargetCategoryCodes } from '@/lib/easa/category-selection'


export async function enrollInCourse(courseId: string) {
  const user = await requireStudent()

  // 1. Basic user status check
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { registrationPaid: true, status: true },
  })

  if (!dbUser || dbUser.status !== UserStatus.ACTIVE) {
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
    select: {
      enrollmentType: true,
      pathwayRel: { select: { code: true } },
      programmeChoice: true,
    },
  })
  if (!profile) return { error: 'Student profile not found.' }

  const { allowed, error: validationError } = await import('@/lib/enrollment/validation').then(
    (v) => v.validateCourseEnrollment(user.id, courseId)
  )

  if (!allowed) {
    return { error: validationError || 'You are not eligible for this course.' }
  }

  const effectiveEnrollmentType =
    resolveEffectiveEnrollmentType({
      pathwayCode: profile.pathwayRel?.code,
      enrollmentType: profile.enrollmentType,
      programmeChoice: profile.programmeChoice,
    }) || 'MODULAR'

  // 4. Check if already enrolled
  const existing = await prisma.enrollment.findFirst({
    where: {
      userId: user.id,
      courseId: courseId,
      status: {
        in: [
          EnrollmentStatus.ACTIVE,
          EnrollmentStatus.ENROLLED,
          EnrollmentStatus.APPROVED,
          EnrollmentStatus.PENDING,
          EnrollmentStatus.SUSPENDED,
        ],
      },
    },
  })

  if (existing) {
    return { error: 'You are already enrolled or have a pending enrollment for this course.' }
  }

  try {
    const coursePrice = Number(course.price)
    const isFullTime = effectiveEnrollmentType === 'FULL_TIME'

    // Determine if this is a "Mandatory" course for FT students
    let isMandatoryFT = false
    if (isFullTime) {
      const ftEnrollment = await prisma.fullTimeEnrollment.findFirst({
        where: { studentId: user.id, status: EnrollmentStatus.ACTIVE },
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
    const shouldCharge = effectiveEnrollmentType === 'MODULAR' || (isFullTime && !isMandatoryFT)

    if (shouldCharge) {
      const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })

      if (!wallet || Number(wallet.availableBalance) < coursePrice) {
        return {
          error: `Insufficient funds. Course costs ${course.currency} ${coursePrice.toFixed(2)}. Please top up your wallet.`,
        }
      }

      // We need to capture the funds directly and auto-enroll

      await prisma.$transaction(
        async (tx) => {
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
              status: EnrollmentStatus.ACTIVE, // Auto-approved because paid in full
              enrolledAt: new Date(),
              approvedAt: new Date(),
              amountPaid: coursePrice,
            },
          })

          // Upgrade APPLICANT to STUDENT if needed
          const authUser = await tx.user.findUnique({ where: { id: user.id } })
          if (authUser?.role === UserRole.APPLICANT) {
            await tx.user.update({
              where: { id: user.id },
              data: { role: UserRole.STUDENT },
            })
            await tx.studentProfile.update({
              where: { userId: user.id },
              data: { enrollmentStatus: EnrollmentStatus.ENROLLED },
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
        },
        {
          maxWait: 15000,
          timeout: 30000,
        }
      )
    } else {
      // Mandatory FULL_TIME course
      await prisma.enrollment.create({
        data: {
          userId: user.id,
          courseId: courseId,
          status: EnrollmentStatus.ACTIVE, // Mandatory courses are auto-active
          enrolledAt: new Date(),
          approvedAt: new Date(),
          amountPaid: course.price,
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
    revalidatePath('/student')

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

  // 0. Pathway Restrictions — only EXAM_ONLY students can book exams
  try {
    await assertExamOnlyPathway(user.id)
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Access denied.' }
  }

  // 1. Get Pool Details & validate status
  const pool = await prisma.examPool.findUnique({
    where: { id: poolId },
    select: {
      id: true,
      name: true,
      eventId: true,
      seatPrice: true,
      status: true,
    },
  })

  if (!pool) return { error: 'Exam booking not found.' }
  if (!([PoolStatus.OPEN, PoolStatus.NEAR_FULL] as string[]).includes(pool.status)) {
    return { error: 'This exam booking is no longer accepting new members.' }
  }

  // 2. Event Cap — max 4 pools per event (joinPoolInternal only enforces a global cap)
  const eventMemberships = await prisma.poolMembership.count({
    where: {
      userId: user.id,
      pool: { eventId: pool.eventId },
      status: { in: [MembershipStatus.RESERVED, MembershipStatus.CONFIRMED] },
    },
  })
  if (eventMemberships >= 4) {
    return {
      error: 'Module capacity reached. You can join at most 4 bookings in a single exam event.',
    }
  }

  // 3. Find exam component
  const examComponent = await prisma.examComponent.findFirst({
    where: { code: moduleCode },
    select: { id: true, categoryCode: true, course: { select: { code: true } } },
  })
  if (!examComponent) {
    return { error: `No exam component found for module ${moduleCode}.` }
  }

  const targetCategories = await getStudentTargetCategoryCodes(prismaUnfiltered, user.id)
  if (
    targetCategories.length > 0 &&
    !categoryMatchesTarget(examComponent.categoryCode, targetCategories)
  ) {
    return { error: 'This module/category is not part of your selected licence pathway.' }
  }

  // 4. Wallet fast-fail (for UX; joinPool enforces atomically too)
  const seatPrice = Number(pool.seatPrice)
  const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
  if (!wallet || Number(wallet.availableBalance) < seatPrice) {
    return {
      error: 'Insufficient wallet balance. Please top up your wallet and try again.',
    }
  }

  // 5. Delegate to the canonical joinPool (Phase 3 path):
  //    - resolveStandardPoolForJoin picks the optimal pool for the module
  //    - sets demandStatus='POOLED', guaranteeType='POOL_FLEX', guaranteedSeat=false
  //    - runs time-conflict detection
  //    - auto-confirms when threshold is met
  const joinResult = await joinPool({
    poolId,
    userId: user.id,
    examComponentId: examComponent.id,
    eventId: pool.eventId,
    moduleCode: examComponent.course.code,
    bookingType: 'POOL',
    reserveAmount: seatPrice,
    amountPaid: seatPrice,
  })

  if (!joinResult.success) {
    return { error: joinResult.error }
  }

  // 6. Role upgrade: APPLICANT → STUDENT (portal-specific concern)
  if (user.role === UserRole.APPLICANT) {
    await prisma.$transaction(
      async (tx) => {
        await tx.user.update({
          where: { id: user.id },
          data: { role: UserRole.STUDENT },
        })
        const sp = await tx.studentProfile.findUnique({ where: { userId: user.id } })
        if (sp) {
          await tx.studentProfile.update({
            where: { userId: user.id },
            data: { enrollmentStatus: EnrollmentStatus.ENROLLED },
          })
        }
      },
      {
        timeout: 20000,
      }
    )
  }

  // 7. In-app notification
  await prisma.notification.create({
    data: {
      userId: user.id,
      title: 'Exam Booking Joined Successfully',
      message: `You have successfully secured a seat in ${pool.name} for module ${examComponent.course.code}.`,
      type: 'SUCCESS',
      linkUrl: '/student/exam-bookings/my-bookings',
      linkText: 'View Bookings',
    },
  })

  revalidatePath('/student/exam-bookings')
  revalidatePath('/student/exam-bookings/my-bookings')
  revalidatePath('/student/wallet')
  revalidatePath('/student')
  return { success: true }
}

export async function createStudentPoolAction(input: CreatePoolInput) {
  const user = await requireStudent()

  const validation = validateBody(studentCreatePoolSchema, input)
  if ('error' in validation) {
    return { error: validation.error }
  }

  const { eventId, moduleCode, examDate, examTimeSlot, bookingType, seats, organizationName } =
    validation.data

  try {
    // 0. Pathway Restrictions — only EXAM_ONLY students can book exams
    await assertExamOnlyPathway(user.id)

    // 1. Get Pricing & Check Balance
    const pricing = await getExamPricingConfig()
    const isGroup = bookingType === 'GROUP_CHARTER'
    const seatPrice = isGroup ? pricing.groupCharterFee : pricing.poolExamFee

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
    if (!wallet || Number(wallet.availableBalance) < seatPrice) {
      return {
        error: `Insufficient funds. Starting a ${isGroup ? 'group charter' : 'booking'} requires a reservation of ${seatPrice.toFixed(2)}. Please top up your wallet.`,
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
        status: { in: [MembershipStatus.RESERVED, MembershipStatus.CONFIRMED] },
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
        status: { in: [MembershipStatus.RESERVED, MembershipStatus.CONFIRMED] },
      },
    })
    if (moduleInEvent) {
      return { error: `You are already booked for Module ${moduleCode} in this exam event.` }
    }

    // 3. Find Exam Component
    const examComponent = await prisma.examComponent.findFirst({
      where: { code: moduleCode },
      include: { course: true },
    })
    if (!examComponent) return { error: `No exam component found for module ${moduleCode}.` }

    const targetCategories = await getStudentTargetCategoryCodes(prismaUnfiltered, user.id)
    if (
      targetCategories.length > 0 &&
      !categoryMatchesTarget(examComponent.categoryCode, targetCategories)
    ) {
      return { error: 'This module/category is not part of your selected licence pathway.' }
    }

    const poolModuleCode = examComponent.course.code

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
    const pool = await prisma.$transaction(
      async (tx) => {
        const { reserveFunds } = await import('@/lib/wallet/operations')

        // A. Create Pool
        const newPool = await tx.examPool.create({
          data: {
            eventId,
            name: isGroup
              ? organizationName || `Group - ${poolModuleCode}`
              : `Student Initiated - ${poolModuleCode}`,
            examDate: date,
            examStartTime: startTime,
            examEndTime: endTime,
            seatPrice,
            allowedModules: [poolModuleCode],
            status: isGroup ? PoolStatus.CONFIRMED : PoolStatus.OPEN,
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
        const primaryModule = poolModuleCode
        const primaryExamComponentId = examComponent.id

        const booking = await tx.examBooking.create({
          data: {
            userId: user.id,
            eventId,
            examComponentId: primaryExamComponentId,
            bookingType: isGroup ? 'GROUP_CHARTER' : 'POOL',
            moduleCode: primaryModule,
            examDate: date,
            amountPaid: seatPrice,
            status: PaymentStatus.PENDING,
            groupName: isGroup ? organizationName || null : null,
            groupRepId: isGroup ? user.id : null,
          },
        })

        await tx.poolMembership.create({
          data: {
            userId: user.id,
            poolId: newPool.id,
            bookingId: booking.id,
            status: MembershipStatus.RESERVED,
            examComponentId: primaryExamComponentId,
            amountReserved: seatPrice,
          },
        })

        // D. Role Upgrade: APPLICANT → STUDENT
        if (user.role === UserRole.APPLICANT) {
          await tx.user.update({
            where: { id: user.id },
            data: { role: UserRole.STUDENT },
          })
          const studentProfile = await tx.studentProfile.findUnique({ where: { userId: user.id } })
          if (studentProfile) {
            await tx.studentProfile.update({
              where: { userId: user.id },
              data: { enrollmentStatus: EnrollmentStatus.ENROLLED },
            })
          }
        }

        // Send Notification
        await tx.notification.create({
          data: {
            userId: user.id,
            title: 'Exam Booking Created',
            message: `You have successfully created a new exam booking for module ${poolModuleCode} and reserved your seat.`,
            type: 'SUCCESS',
            linkUrl: '/student/exam-bookings/my-bookings',
            linkText: 'View Bookings',
          },
        })

        return newPool
      },
      {
        timeout: 30000,
      }
    )

    revalidatePath('/student/exam-bookings')
    revalidatePath('/student/wallet')
    revalidatePath('/student')

    return { success: true, poolId: pool.id }
  } catch (error: unknown) {
    console.error(
      'Create Student Pool Error:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return { error: 'Failed to create exam booking. Please try again.' }
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

export async function payPendingExamBooking(bookingId: string) {
  const user = await requireStudent()

  try {
    const booking = await prisma.examBooking.findFirst({
      where: { id: bookingId, userId: user.id },
    })

    if (!booking) return { error: 'Booking not found.' }
    if (booking.status !== PaymentStatus.PENDING)
      return { error: 'This booking is not pending payment.' }

    // If it's part of a group, we pay for the entire group
    const groupBookings = booking.bookingGroupRef
      ? await prisma.examBooking.findMany({
          where: {
            bookingGroupRef: booking.bookingGroupRef,
            userId: user.id,
            status: PaymentStatus.PENDING,
          },
        })
      : [booking]

    const totalAmount = groupBookings.reduce((sum, b) => sum + Number(b.amountPaid), 0)
    if (totalAmount <= 0) return { error: 'No payment required for this booking.' }

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
    if (!wallet || Number(wallet.availableBalance) < totalAmount) {
      return { error: 'Insufficient funds in wallet. Please top up.' }
    }

    await prisma.$transaction(
      async (tx) => {
        await chargeWallet(
          tx,
          user.id,
          totalAmount,
          `Payment for ${booking.bookingGroupRef ? 'Bundle' : 'Exam'}: ${booking.moduleCode || 'Invoiced'}`,
          booking.id,
          'EXAM_BOOKING'
        )

        await tx.examBooking.updateMany({
          where: { id: { in: groupBookings.map((b) => b.id) } },
          data: { status: PaymentStatus.APPROVED },
        })

        await tx.notification.create({
          data: {
            userId: user.id,
            title: 'Exam Payment Successful',
            message: `Your payment was processed. Seats for ${groupBookings.length} module(s) are now secured.`,
            type: 'SUCCESS',
            linkUrl: '/student/exams',
            linkText: 'View My Exams',
          },
        })
      },
      {
        timeout: 20000,
      }
    )

    revalidatePath('/student/exams')
    revalidatePath('/student/wallet')
    revalidatePath('/student')
    return { success: true }
  } catch (error) {
    console.error('Pay booking error:', error)
    return { error: 'Failed to process payment.' }
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

interface UserSettings {
  notifications?: {
    email?: boolean
    sms?: boolean
    push?: boolean
  }
  appearance?: {
    theme?: 'light' | 'dark' | 'system'
  }
  [key: string]: unknown
}

export async function updateEmailNotifications(enabled: boolean) {
  const user = await requireStudent()

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { settings: true },
    })

    const currentSettings = (dbUser?.settings as UserSettings) || {}
    const newSettings = {
      ...currentSettings,
      notifications: {
        ...(currentSettings.notifications || {}),
        email: enabled,
      },
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { settings: newSettings },
    })

    revalidatePath('/student/profile')
    return { success: true }
  } catch (error) {
    console.error('Update Notifications Error:', error)
    return { error: 'Failed to update notification settings.' }
  }
}

export async function updateUserSettings(settings: UserSettings) {
  const user = await requireStudent()

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { settings: true },
    })

    const currentSettings = (dbUser?.settings as UserSettings) || {}
    const newSettings = {
      ...currentSettings,
      ...settings,
      notifications: {
        ...(currentSettings.notifications || {}),
        ...(settings.notifications || {}),
      },
      appearance: {
        ...(currentSettings.appearance || {}),
        ...(settings.appearance || {}),
      },
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { settings: newSettings },
    })

    revalidatePath('/student/profile')
    return { success: true }
  } catch (error) {
    console.error('Update User Settings Error:', error)
    return { error: 'Failed to update settings.' }
  }
}

export async function getAvailableRecipients() {
  const session = await getAuthSession()
  if (!session) return []

  // 1. Fetch Admins
  const admins = await prisma.user.findMany({
    where: {
      role: { in: [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF] },
      status: UserStatus.ACTIVE,
    },
    select: {
      id: true,
      email: true,
      role: true,
      profile: {
        select: {
          firstName: true,
          middleName: true,
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
      status: {
        in: [
          EnrollmentStatus.ACTIVE,
          EnrollmentStatus.ENROLLED,
          EnrollmentStatus.APPROVED,
          EnrollmentStatus.GRADUATED,
        ],
      },
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
                      email: true,
                      role: true,
                      profile: {
                        select: {
                          firstName: true,
                          middleName: true,
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

  type InstructorUser = {
    id: string
    email: string | null
    role: string
    profile: {
      firstName: string
      middleName: string | null
      lastName: string
      profilePhotoUrl: string | null
    } | null
  }

  // Extract unique instructors
  const instructorMap = new Map<string, InstructorUser>()

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
      email?: string | null
      role: string
      profile?: {
        firstName: string
        middleName?: string | null
        lastName: string
        profilePhotoUrl?: string | null
      } | null
    },
    roleOverride?: string
  ) => {
    const role = roleOverride || u.role
    const roleLabel =
      role === 'INSTRUCTOR'
        ? 'Instructor'
        : role === 'SUPER_ADMIN' || role === 'ADMIN'
          ? 'Administrator'
          : 'Staff'
    return {
      id: u.id,
      label: u.profile
        ? [u.profile.firstName, u.profile.middleName, u.profile.lastName]
            .filter(Boolean)
            .join(' ') + ` (${roleLabel})`
        : u.email
          ? `${u.email} (${roleLabel})`
          : roleLabel,
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

    // Audit 5i: students may only message admin/staff or an instructor assigned
    // to them / their current or previous class. Enforce server-side using the
    // same scoped recipient set the compose UI is built from.
    if (user.role === 'STUDENT') {
      const allowed = await getAvailableRecipients()
      if (!allowed.some((r) => r.id === recipientId)) {
        return {
          error:
            'You can only message administrators, staff, or an instructor assigned to your class.',
        }
      }
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
    console.error('Send message error:', error instanceof Error ? error.message : 'Unknown error')
    return { error: 'Failed to send message. Please try again.' }
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
    await assertExamOnlyPathway(user.id)
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
    revalidatePath('/student')
    return { success: true, usedBundle: result.usedBundle }
  } catch (error: unknown) {
    console.error('bookStandaloneExamAction error:', error)
    const message = error instanceof Error ? error.message : 'Failed to book exam.'
    return { error: message }
  }
}

export async function bookBundleExamsAction(params: { moduleCodes: string[]; eventId: string }) {
  return bookBundleExamsAtomicAction(params)
}

export async function bookBundleExamsAtomicAction(params: {
  moduleCodes: string[]
  eventId: string
}) {
  try {
    const user = await requireStudent()
    await assertExamOnlyPathway(user.id)
    const { moduleCodes, eventId } = params

    if (!moduleCodes.length || !eventId) {
      return { error: 'Missing booking parameters.' }
    }

    const bookingType =
      moduleCodes.length === 2 ? 'TWIN_PACK' : moduleCodes.length === 4 ? 'FOUR_PACK' : null
    if (!bookingType) {
      return { error: 'Bundles must contain exactly 2 or 4 modules.' }
    }

    const pricing = await getExamPricingConfig()
    const bundlePrice = bookingType === 'TWIN_PACK' ? pricing.twoSeatBundle : pricing.fourSeatBundle
    const components = await prisma.examComponent.findMany({
      where: { code: { in: moduleCodes } },
      include: { course: true },
    })

    if (components.length !== moduleCodes.length) {
      return { error: 'One or more selected modules could not be found.' }
    }

    const targetCategories = await getStudentTargetCategoryCodes(prisma, user.id)
    if (
      targetCategories.length > 0 &&
      components.some(
        (component) => !categoryMatchesTarget(component.categoryCode, targetCategories)
      )
    ) {
      return {
        error:
          'One or more selected module categories are not part of your selected licence pathway.',
      }
    }

    const wallet = await prisma.wallet.findUnique({ where: { userId: user.id } })
    if (!wallet || Number(wallet.availableBalance) < bundlePrice) {
      return { error: `Insufficient funds. Bundle price is €${bundlePrice.toFixed(2)}.` }
    }

    await prisma.$transaction(
      async (tx) => {
        await chargeWallet(
          tx,
          user.id,
          bundlePrice,
          `${bookingType === 'TWIN_PACK' ? 'Twin Pack' : '4-Pack'} bundle purchase: ${components.map((component) => component.code).join(', ')}`,
          eventId,
          'EXAM_BUNDLE'
        )

        const validUntil = new Date()
        validUntil.setFullYear(validUntil.getFullYear() + 1)

        const bundle = await tx.examBundle.create({
          data: {
            userId: user.id,
            bundleType: bookingType === 'TWIN_PACK' ? 'TWO_SEAT' : 'FOUR_SEAT',
            totalSeats: moduleCodes.length,
            usedSeats: 0,
            status: 'ACTIVE',
            amountPaid: bundlePrice,
            freeModuleChanges: bookingType === 'FOUR_PACK' ? 1 : 0,
            // Audit 1c: Twin Pack = 1 free resit, Four Pack = 2 free resits.
            freeResitsIncluded: bookingType === 'FOUR_PACK' ? 2 : 1,
            usedFreeResits: 0,
            validUntil,
          },
        })

        for (const component of components) {
          const result = await placeExamBookingInStandardPool(tx, {
            userId: user.id,
            eventId,
            examComponentId: component.id,
            moduleCode: component.course.code,
            bookingType,
            reserveAmount: 0,
            bundleId: bundle.id,
          })

          if (!result.success) {
            throw new Error(result.error || `Failed to place module ${component.course.code}.`)
          }
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 20000,
      }
    )

    const typeStr = bookingType === 'TWIN_PACK' ? 'Twin Pack' : '4-Pack'
    const modulesStr = components.map((component) => component.code).join(', ')

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: `Bundle Booking Confirmed (${moduleCodes.length} seats)`,
        message: `You booked modules ${modulesStr} using the ${typeStr}.`,
        type: 'SUCCESS',
        linkUrl: '/student/exams',
        linkText: 'View Exams',
      },
    })

    revalidatePath('/student/exam-bookings')
    revalidatePath('/student/exams')
    revalidatePath('/student/wallet')
    revalidatePath('/student')
    return { success: true, bookedCount: components.length }
  } catch (error: unknown) {
    console.error('bookBundleExamsAtomicAction error:', error)
    return { error: error instanceof Error ? error.message : 'Failed to book bundle. No seats were reserved.' }
  }
}

export async function bookResitExamAction(moduleCode: string, eventId: string) {
  try {
    const user = await requireStudent()
    await assertExamOnlyPathway(user.id)
    const component = await prisma.examComponent.findFirst({
      where: { code: moduleCode },
      select: { categoryCode: true },
    })
    const targetCategories = await getStudentTargetCategoryCodes(prisma, user.id)
    if (
      component &&
      targetCategories.length > 0 &&
      !categoryMatchesTarget(component.categoryCode, targetCategories)
    ) {
      return { error: 'This resit category is not part of your selected licence pathway.' }
    }
    await bookResitExam(user.id, moduleCode, eventId)

    await prisma.notification.create({
      data: {
        userId: user.id,
        title: 'Resit Exam Booked',
        message: `You have successfully booked a resit for module "${moduleCode}".`,
        type: 'SUCCESS',
        linkUrl: '/student/exams',
        linkText: 'View Exams',
      },
    })

    revalidatePath('/student/exams')
    revalidatePath('/student/wallet')
    revalidatePath('/student')
    return { success: true }
  } catch (error: unknown) {
    console.error('bookResitExamAction error:', error)
    return { error: error instanceof Error ? error.message : 'Failed to book resit exam.' }
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

export async function cancelMyBookingAction(bookingId: string, reason?: string) {
  try {
    const user = await requireStudent()

    // Verify the booking belongs to this student
    const booking = await prisma.examBooking.findUnique({
      where: { id: bookingId },
      select: { userId: true },
    })
    if (!booking || booking.userId !== user.id) {
      return { error: 'Booking not found or access denied.' }
    }

    const { cancelBooking } = await import('@/lib/pools/cancellation')
    const result = await cancelBooking(bookingId, user.id, reason)

    if (!result.success) {
      return { error: result.error || 'Failed to cancel booking.' }
    }

    revalidatePath('/student/exam-bookings')
    revalidatePath('/student/wallet')
    revalidatePath('/student/exams')
    revalidatePath('/student')
    return {
      success: true,
      refundAmount: result.refundAmount,
      refundType: result.refundType,
    }
  } catch (error: unknown) {
    console.error(
      'cancelMyBookingAction error:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return { error: 'Failed to cancel booking. Please try again.' }
  }
}

export async function changeModuleBookingAction(bookingId: string, newModuleCode: string) {
  try {
    const user = await requireStudent()

    // Find the booking
    const booking = await prisma.examBooking.findUnique({
      where: { id: bookingId },
      include: {
        poolMemberships: { include: { pool: { include: { memberships: true } } } },
      },
    })

    if (!booking || booking.userId !== user.id) {
      return { error: 'Booking not found or access denied.' }
    }

    // Find an active bundle with free changes
    const bundle = await prisma.examBundle.findFirst({
      where: {
        userId: user.id,
        status: 'ACTIVE',
      },
    })

    if (!bundle || bundle.freeModuleChanges <= bundle.usedModuleChanges) {
      return { error: 'No free module changes available in your bundle.' }
    }

    const newComponent = await prisma.examComponent.findFirst({
      where: { course: { code: newModuleCode } },
    })

    if (!newComponent) {
      return { error: 'Target module component not found.' }
    }

    await prisma.$transaction(async (tx) => {
      // Update booking
      await tx.examBooking.update({
        where: { id: bookingId },
        data: {
          moduleCode: newModuleCode,
          examComponentId: newComponent.id,
        },
      })

      // Update pool membership if exists
      if (booking.poolMemberships.length > 0) {
        await tx.poolMembership.updateMany({
          where: { bookingId },
          data: { examComponentId: newComponent.id },
        })
      }

      // Consume a free change
      await tx.examBundle.update({
        where: { id: bundle.id },
        data: { usedModuleChanges: { increment: 1 } },
      })
    })

    revalidatePath('/student/exam-bookings')
    revalidatePath('/student/exam-bookings/' + bookingId)
    return { success: true }
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Failed to change module.' }
  }
}

export async function createGroupBookingAction(params: {
  eventId: string
  groupName: string
  memberCount: number
  modules: string[]
}) {
  try {
    const user = await requireStudent()
    await assertExamOnlyPathway(user.id)

    const { createGroupBooking } = await import('@/lib/pools/group-booking')
    const result = await createGroupBooking({
      repUserId: user.id,
      eventId: params.eventId,
      groupName: params.groupName,
      memberCount: params.memberCount,
      modules: params.modules,
    })

    revalidatePath('/student/exam-bookings')
    revalidatePath('/student/wallet')
    revalidatePath('/student')
    return { success: true, poolId: result.pool.id, bookingId: result.booking.id }
  } catch (error: unknown) {
    console.error(
      'createGroupBookingAction error:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return { error: error instanceof Error ? error.message : 'Failed to create group booking.' }
  }
}

export async function setReferrerAction(input: string) {
  try {
    const user = await requireStudent()

    // 1. Check if already referred (one person can only be referred by one person)
    const existingReferral = await prisma.referral.findFirst({
      where: { refereeId: user.id },
    })

    if (existingReferral) {
      return { error: 'You have already set a referrer.' }
    }

    // 2. Find referrer by Email or Referral Code
    const referrer = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input.toLowerCase().trim() },
          { referralCode: { equals: input.trim(), mode: 'insensitive' } },
        ],
      },
    })

    if (!referrer) {
      return { error: 'No student found with that email address or referral code.' }
    }

    if (referrer.role !== 'STUDENT' && referrer.role !== 'STAFF') {
      return { error: 'This user is not eligible to be a referrer.' }
    }

    if (referrer.id === user.id) {
      return { error: 'You cannot refer yourself.' }
    }

    // 3. Circular dependency check: If A referred B, B cannot refer A
    const circularReferral = await prisma.referral.findFirst({
      where: {
        referrerId: user.id,
        refereeId: referrer.id,
      },
    })

    if (circularReferral) {
      return { error: 'Circular referral detected: You have already referred this person.' }
    }

    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        refereeId: user.id,
        status: 'PENDING',
      },
    })

    revalidatePath('/student/ambassador')
    return { success: true }
  } catch (error: unknown) {
    console.error('setReferrerAction error:', error)
    return { error: 'Failed to set referrer.' }
  }
}

// ============================================================================
// STUDENT CALENDAR EVENTS
// ============================================================================

export async function createCalendarEvent(data: {
  title: string
  description?: string
  startDate: string
  endDate?: string
  color?: string
  recurrenceType?: string
  recurrenceDays?: string
  recurrenceUntil?: string
}) {
  const user = await requireStudent()

  if (!data.title.trim()) return { error: 'Title is required.' }
  if (!data.startDate) return { error: 'Start date is required.' }

  try {
    const event = await prisma.studentCalendarEvent.create({
      data: {
        userId: user.id,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        color: data.color || '#3b82f6',
        recurrenceType: (data.recurrenceType as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM' | undefined) || 'NONE',
        recurrenceDays: data.recurrenceDays || null,
        recurrenceUntil: data.recurrenceUntil ? new Date(data.recurrenceUntil) : null,
      },
    })

    revalidatePath('/student/academic-calendar')
    return { success: true, eventId: event.id }
  } catch (error) {
    console.error('Create Calendar Event Error:', error)
    return { error: 'Failed to create event.' }
  }
}

export async function updateCalendarEvent(
  eventId: string,
  data: {
    title?: string
    description?: string
    startDate?: string
    endDate?: string
    color?: string
    recurrenceType?: string
    recurrenceDays?: string
    recurrenceUntil?: string
  }
) {
  const user = await requireStudent()

  try {
    const existing = await prisma.studentCalendarEvent.findUnique({
      where: { id: eventId },
    })

    if (!existing || existing.userId !== user.id) {
      return { error: 'Event not found or not authorized.' }
    }

    await prisma.studentCalendarEvent.update({
      where: { id: eventId },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && { description: data.description.trim() || null }),
        ...(data.startDate && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
        ...(data.color && { color: data.color }),
        ...(data.recurrenceType !== undefined && { recurrenceType: data.recurrenceType as 'NONE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM' }),
        ...(data.recurrenceDays !== undefined && { recurrenceDays: data.recurrenceDays || null }),
        ...(data.recurrenceUntil !== undefined && {
          recurrenceUntil: data.recurrenceUntil ? new Date(data.recurrenceUntil) : null,
        }),
      },
    })

    revalidatePath('/student/academic-calendar')
    return { success: true }
  } catch (error) {
    console.error('Update Calendar Event Error:', error)
    return { error: 'Failed to update event.' }
  }
}

export async function deleteCalendarEvent(eventId: string) {
  const user = await requireStudent()

  try {
    const existing = await prisma.studentCalendarEvent.findUnique({
      where: { id: eventId },
    })

    if (!existing || existing.userId !== user.id) {
      return { error: 'Event not found or not authorized.' }
    }

    await prisma.studentCalendarEvent.delete({
      where: { id: eventId },
    })

    revalidatePath('/student/academic-calendar')
    return { success: true }
  } catch (error) {
    console.error('Delete Calendar Event Error:', error)
    return { error: 'Failed to delete event.' }
  }
}
