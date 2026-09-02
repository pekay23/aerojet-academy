'use server'

import { prismaUnfiltered } from '@/lib/prisma/client'
import type { AttendanceStatus } from '@prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns'
import { serializePrisma } from '@/lib/utils/serialization'
import { revalidatePath, revalidateTag } from 'next/cache'
import { calculateLetterGrade, isPassing } from '@/lib/utils/grading'
import { getInstructorProfileIdOrThrow } from '@/lib/instructor/profile'

export async function getInstructorDashboardData() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') {
    throw new Error('Unauthorized')
  }

  const instructorId = await getInstructorProfileIdOrThrow(session.user.id)
  const now = new Date()

  // 1. Fetch Today's Classes
  const todaysClasses = await prismaUnfiltered.class.findMany({
    where: {
      instructorId,
      startDate: {
        lte: endOfDay(now),
      },
      endDate: {
        gte: startOfDay(now),
      },
    },
    include: {
      course: true,
    },
    orderBy: {
      startDate: 'asc',
    },
  })

  // 2. Fetch Active Cohorts
  const activeCohorts = await prismaUnfiltered.course.findMany({
    where: {
      classes: {
        some: {
          instructorId,
        },
      },
      isActive: true,
    },
    include: {
      _count: {
        select: { enrollments: true },
      },
    },
  })

  // 3. Stats
  const enrollmentsForCount = await prismaUnfiltered.enrollment.findMany({
    where: {
      course: {
        classes: {
          some: { instructorId },
        },
      },
      status: { in: ['ACTIVE', 'ENROLLED', 'APPROVED'] },
    },
    select: { userId: true },
  })
  const totalStudents = new Set(enrollmentsForCount.map(e => e.userId)).size

  // 4. Pending Grades Count
  const pendingGradesCount = await prismaUnfiltered.grade.count({
    where: {
      gradedBy: instructorId,
      score: 0,
    },
  })

  // 5. Enriched Unified Notices (News + Events)
  const [news, upcomingExams, adminEvents] = await Promise.all([
    prismaUnfiltered.newsArticle.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { publishedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        publishedAt: true,
        slug: true,
      },
    }),
    prismaUnfiltered.examEvent.findMany({
      where: {
        status: { in: ['OPEN', 'CONFIRMED', 'DRAFT'] },
        // Show exams that haven't ended yet
        endDate: { gte: now },
      },
      orderBy: { startDate: 'asc' },
      take: 5,
      select: {
        id: true,
        name: true,
        startDate: true,
      },
    }),
    prismaUnfiltered.adminCalendarEvent.findMany({
      where: {
        visibleTo: { in: ['ALL', 'INSTRUCTORS'] },
        // Show events that are upcoming or currently active
        OR: [
          { startDate: { gte: now } },
          { AND: [{ startDate: { lte: now } }, { endDate: { gte: now } }] },
        ],
        deletedAt: null,
      },
      orderBy: { startDate: 'asc' },
      take: 5,
      select: {
        id: true,
        title: true,
        startDate: true,
      },
    }),
  ])

  const unifiedNotices = [
    ...news.map((n) => ({
      id: n.id,
      title: n.title,
      date: n.publishedAt || new Date(),
      type: 'NEWS',
      link: `/newsroom/${n.slug}`,
    })),
    ...upcomingExams.map((e) => ({
      id: e.id,
      title: `Exam Window: ${e.name}`,
      date: e.startDate,
      type: 'EXAM',
      link: `/instructor/schedule?event=${e.id}`,
    })),
    ...adminEvents.map((a) => ({
      id: a.id,
      title: a.title,
      date: a.startDate,
      type: 'EVENT',
      link: '/instructor/schedule',
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  // 6. Pending Grading Details
  const pendingGradingDetails = await prismaUnfiltered.grade.findMany({
    where: {
      gradedBy: instructorId,
      score: 0,
    },
    take: 5,
    include: {
      user: {
        select: {
          profile: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      enrollment: {
        include: {
          course: true,
        },
      },
    },
  })

  return serializePrisma({
    todaysClasses,
    activeCohortsCount: activeCohorts.length,
    totalStudents,
    pendingGradesCount,
    activeCohorts,
    recentNotices: unifiedNotices,
    pendingGradingDetails: pendingGradingDetails.map((g) => ({
      id: g.id,
      module: g.enrollment.course.code,
      type: g.assessmentType,
      studentName: `${g.user.profile?.firstName} ${g.user.profile?.lastName}`,
      assessmentName: g.assessmentName,
      date: g.assessmentDate,
    })),
  })
}

export async function getInstructorSchedule(startDate?: Date, endDate?: Date) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return null

  const instructorId = await getInstructorProfileIdOrThrow(session.user.id)
  const now = new Date()
  const rangeStart = startDate || startOfWeek(now, { weekStartsOn: 1 })
  const rangeEnd = endDate || endOfWeek(now, { weekStartsOn: 1 })

  return serializePrisma(
    await prismaUnfiltered.class.findMany({
      where: {
        instructorId,
        startDate: {
          lte: rangeEnd,
        },
        endDate: {
          gte: rangeStart,
        },
      },
      include: {
        course: {
          include: {
            _count: {
              select: { enrollments: true },
            },
          },
        },
      },
      orderBy: {
        startDate: 'asc',
      },
    })
  )
}

export async function submitGrade(data: { gradeId: string; score: number; comments?: string }) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') {
    throw new Error('Unauthorized')
  }

  const instructorId = await getInstructorProfileIdOrThrow(session.user.id)

  const updatedGrade = await prismaUnfiltered.grade.update({
    where: { id: data.gradeId },
    data: {
      score: data.score,
      comments: data.comments,
      gradedBy: instructorId,
      updatedAt: new Date(),
    },
  })

  revalidatePath('/instructor/grading/pending')
  revalidatePath('/instructor/grading/history')
  revalidatePath('/instructor/dashboard')

  return serializePrisma(updatedGrade)
}

export async function getPendingGradingCount() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return 0

  const instructorId = await getInstructorProfileIdOrThrow(session.user.id)

  return await prismaUnfiltered.grade.count({
    where: {
      gradedBy: instructorId,
      score: 0,
    },
  })
}

export async function getGradingQueue() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return []

  const instructorId = await getInstructorProfileIdOrThrow(session.user.id)

  return serializePrisma(
    await prismaUnfiltered.grade.findMany({
      where: {
        gradedBy: instructorId,
        score: 0,
      },
      include: {
        user: {
          include: { profile: true },
        },
        enrollment: {
          include: { course: true },
        },
      },
      orderBy: {
        assessmentDate: 'desc',
      },
    })
  )
}
export async function getGradingHistory() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return []

  const instructorId = await getInstructorProfileIdOrThrow(session.user.id)

  return serializePrisma(
    await prismaUnfiltered.grade.findMany({
      where: {
        gradedBy: instructorId,
        score: { gt: 0 },
      },
      include: {
        user: {
          include: { profile: true },
        },
        enrollment: {
          include: { course: true },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })
  )
}

export async function getMyClasses() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return []

  const instructorId = await getInstructorProfileIdOrThrow(session.user.id)

  return serializePrisma(
    await prismaUnfiltered.class.findMany({
      where: {
        instructorId,
      },
      include: {
        course: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    })
  )
}

export async function getClassData(classId: string) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return null

  const instructorId = await getInstructorProfileIdOrThrow(session.user.id)

  return serializePrisma(
    await prismaUnfiltered.class.findUnique({
      where: { id: classId, instructorId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { status: { in: ['ACTIVE', 'ENROLLED', 'APPROVED'] } },
              include: { user: { include: { profile: true } } },
            },
          },
        },
      },
    })
  )
}

export async function getClassAttendance(classId: string, date?: Date) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return null

  const instructorId = await getInstructorProfileIdOrThrow(session.user.id)
  const classData = await prismaUnfiltered.class.findUnique({
    where: { id: classId, instructorId },
    include: {
      course: {
        include: {
          enrollments: {
            where: { status: { in: ['ACTIVE', 'ENROLLED', 'APPROVED'] } },
            include: { user: { include: { profile: true } } },
          },
        },
      },
    },
  })

  if (!classData) throw new Error('Class not found or unauthorized')

  const targetDate = date || new Date()

  const records = await prismaUnfiltered.attendanceRecord.findMany({
    where: {
      classId,
      date: {
        gte: startOfDay(targetDate),
        lte: endOfDay(targetDate),
      },
    },
  })

  return serializePrisma({
    classData,
    records,
    targetDate,
  })
}

export async function recordAttendance(data: {
  classId: string
  userId: string
  date: Date
  status: AttendanceStatus
  notes?: string
}) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') {
    throw new Error('Unauthorized')
  }

  const instructorId = await getInstructorProfileIdOrThrow(session.user.id)

  return serializePrisma(
    await prismaUnfiltered.attendanceRecord.upsert({
      where: {
        classId_userId_date: {
          classId: data.classId,
          userId: data.userId,
          date: startOfDay(data.date),
        },
      },
      update: {
        status: data.status,
        notes: data.notes,
        recordedBy: instructorId,
        updatedAt: new Date(),
      },
      create: {
        classId: data.classId,
        userId: data.userId,
        date: startOfDay(data.date),
        status: data.status,
        notes: data.notes,
        recordedBy: instructorId,
      },
    })
  )
}

export async function getCourseDetails(courseId: string) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return null

  return serializePrisma(
    await prismaUnfiltered.course.findUnique({
      where: { id: courseId },
      include: {
        classes: {
          include: {
            instructor: {
              include: { user: { include: { profile: true } } },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    })
  )
}

export async function getInstructorResources() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return null

  const instructorId = await getInstructorProfileIdOrThrow(session.user.id)

  // 1. Fetch assigned courses (Dynamic Academic Resources)
  const assignedCourses = await prismaUnfiltered.course.findMany({
    where: {
      classes: {
        some: {
          instructorId,
        },
      },
    },
    select: {
      id: true,
      code: true,
      name: true,
      category: true,
      syllabusUrl: true,
      materialsUrl: true,
    },
  })

  // 2. Fetch General Resources from Database
  const generalResources = await prismaUnfiltered.generalResource.findMany({
    where: {
      showToInstructors: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  // Combine academic resources
  const academicResources = assignedCourses.flatMap((course) => {
    const resources = []
    if (course.syllabusUrl) {
      resources.push({
        id: `syl-${course.id}`,
        name: `Syllabus: ${course.code} - ${course.name}`,
        type: 'PDF',
        category: 'ACADEMIC',
        url: course.syllabusUrl,
        updatedAt: new Date().toISOString(),
        courseCode: course.code,
      })
    }
    if (course.materialsUrl) {
      resources.push({
        id: `mat-${course.id}`,
        name: `Course Materials: ${course.code}`,
        type: 'ZIP',
        category: 'ACADEMIC',
        url: course.materialsUrl,
        updatedAt: new Date().toISOString(),
        courseCode: course.code,
      })
    }
    return resources
  })

  return serializePrisma([...academicResources, ...generalResources])
}

export async function getInstructorStudents() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return []

  const instructorId = await getInstructorProfileIdOrThrow(session.user.id)

  const enrollments = await prismaUnfiltered.enrollment.findMany({
    where: {
      course: {
        classes: {
          some: { instructorId },
        },
      },
      status: { in: ['ACTIVE', 'ENROLLED', 'APPROVED'] },
    },
    include: {
      user: {
        include: {
          profile: true,
          studentProfile: true,
        },
      },
      course: true,
    },
  })

  // Group by user to avoid duplicates if a student is in multiple courses with this instructor
  const studentMap = new Map()
  enrollments.forEach((enr) => {
    if (!studentMap.has(enr.userId)) {
      studentMap.set(enr.userId, {
        id: enr.userId,
        name:
          `${enr.user.profile?.firstName || ''} ${enr.user.profile?.lastName || ''}`.trim() ||
          'Unknown Student',
        email: enr.user.email,
        image: enr.user.profile?.profilePhotoUrl,
        studentId: enr.user.studentProfile?.studentId,
        phone: enr.user.profile?.phone,
        courses: [],
      })
    }
    studentMap.get(enr.userId).courses.push({
      id: enr.course.id,
      code: enr.course.code,
      name: enr.course.name,
    })
  })

  return serializePrisma(Array.from(studentMap.values()))
}

/**
 * Former students = students whose enrollment with this instructor's classes
 * has transitioned to a terminal / left state (GRADUATED, DEFERRED, SUSPENDED,
 * WITHDRAWN, EXPELLED) or been soft-deleted (deletedAt is not null).
 * Full history retained per the instructor.former_students project fact.
 */
export async function getInstructorFormerStudents() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return []

  const instructorId = await getInstructorProfileIdOrThrow(session.user.id)

  const enrollments = await prismaUnfiltered.enrollment.findMany({
    where: {
      course: {
        classes: {
          some: { instructorId },
        },
      },
      status: { in: ['GRADUATED', 'DEFERRED', 'SUSPENDED', 'WITHDRAWN', 'EXPELLED'] },
    },
    include: {
      user: {
        include: {
          profile: true,
          studentProfile: true,
        },
      },
      course: true,
    },
  })

  // Group by user to avoid duplicates
  const studentMap = new Map()
  enrollments.forEach((enr) => {
    if (!studentMap.has(enr.userId)) {
      studentMap.set(enr.userId, {
        id: enr.userId,
        name:
          `${enr.user.profile?.firstName || ''} ${enr.user.profile?.lastName || ''}`.trim() ||
          'Unknown Student',
        email: enr.user.email,
        image: enr.user.profile?.profilePhotoUrl,
        studentId: enr.user.studentProfile?.studentId,
        phone: enr.user.profile?.phone,
        courses: [],
        enrollmentStatus: enr.status,
        leftAt: enr.deletedAt ?? enr.updatedAt,
      })
    }
    studentMap.get(enr.userId).courses.push({
      id: enr.course.id,
      code: enr.course.code,
      name: enr.course.name,
    })
  })

  return serializePrisma(Array.from(studentMap.values()))
}

export async function getStudentDetails(userId: string) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return null

  const instructorId = await getInstructorProfileIdOrThrow(session.user.id)

  const student = await prismaUnfiltered.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      studentProfile: true,
      enrollments: {
        where: {
          course: {
            classes: {
              some: { instructorId },
            },
          },
        },
        include: {
          course: true,
          grades: {
            where: { gradedBy: instructorId },
            orderBy: { assessmentDate: 'desc' },
          },
        },
      },
    },
  })

  if (!student) return null

  return serializePrisma(student)
}

export async function getInstructorProfile() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') {
    throw new Error('Unauthorized')
  }

  const profile = await prismaUnfiltered.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      academyEmail: true,
      profile: true,
      instructorProfile: {
        include: {
          classesInstructed: {
            include: {
              course: true,
            },
          },
        },
      },
    },
  })

  if (!profile) throw new Error('Instructor not found')
  if (!profile.profile) throw new Error('User profile missing')
  if (!profile.instructorProfile) throw new Error('Instructor details missing')

  return serializePrisma(
    profile as Omit<typeof profile, 'profile' | 'instructorProfile'> & {
      profile: NonNullable<typeof profile.profile>
      instructorProfile: NonNullable<typeof profile.instructorProfile>
    }
  )
}

interface UpdateProfileData {
  personal: {
    firstName: string
    middleName?: string | null
    lastName: string
    phone?: string | null
    alternatePhone?: string | null
    address?: string | null
    city?: string | null
    state?: string | null
    country?: string | null
    postalCode?: string | null
    gender?: string | null
    dateOfBirth?: string | null
    nationality?: string | null
  }
  emergency: {
    name: string
    phone: string
    relation: string
  }
}

export async function updateInstructorProfile(data: UpdateProfileData) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') {
    throw new Error('Unauthorized')
  }

  const { personal, emergency } = data

  // Update Profile table
  await prismaUnfiltered.profile.update({
    where: { userId: session.user.id },
    data: {
      firstName: personal.firstName,
      middleName: personal.middleName,
      lastName: personal.lastName,
      phone: personal.phone,
      alternatePhone: personal.alternatePhone,
      address: personal.address,
      city: personal.city,
      state: personal.state,
      country: personal.country,
      postalCode: personal.postalCode,
      gender: personal.gender,
      dateOfBirth: personal.dateOfBirth ? new Date(personal.dateOfBirth) : null,
      nationality: personal.nationality,
      emergencyContactName: emergency.name,
      emergencyContactPhone: emergency.phone,
      emergencyContactRelation: emergency.relation,
    },
  })

  revalidatePath('/instructor/profile')
  return { success: true }
}

export async function createInternalGrade(data: {
  userId: string
  enrollmentId: string
  assessmentName: string
  assessmentType: string
  assessmentDate: Date
  score: number
  maxScore: number
  comments?: string
  mcqScore?: number
  essay1Score?: number
  essay2Score?: number
}) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') {
    throw new Error('Unauthorized')
  }

  const instructorId = await getInstructorProfileIdOrThrow(session.user.id)

  const percentage = (data.score / data.maxScore) * 100
  const letterGrade = calculateLetterGrade(percentage)

  const grade = await prismaUnfiltered.grade.create({
    data: {
      userId: data.userId,
      enrollmentId: data.enrollmentId,
      assessmentName: data.assessmentName,
      assessmentType: data.assessmentType,
      assessmentDate: data.assessmentDate,
      score: data.score,
      maxScore: data.maxScore,
      percentage,
      grade: letterGrade,
      comments: data.comments,
      mcqScore: data.mcqScore,
      essay1Score: data.essay1Score,
      essay2Score: data.essay2Score,
      gradedBy: instructorId,
    },
  })

  revalidatePath(`/instructor/students/${data.userId}`)
  revalidatePath('/instructor/dashboard')

  return serializePrisma(grade)
}
