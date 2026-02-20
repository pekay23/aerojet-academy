'use server'

import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns'
import { serializePrisma } from '@/lib/utils/serialization'
import { revalidatePath } from 'next/cache'

async function getInstructorId(userId: string) {
  const profile = await prisma.instructorProfile.findUnique({
    where: { userId },
  })
  if (!profile) throw new Error('Instructor profile not found')
  return profile.id
}

export async function getInstructorDashboardData() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') {
    throw new Error('Unauthorized')
  }

  const instructorId = await getInstructorId(session.user.id)
  const now = new Date()

  // 1. Fetch Today's Classes
  const todaysClasses = await prisma.class.findMany({
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

  // 2. Fetch Active Cohorts (Courses assigned to this instructor)
  const activeCohorts = await prisma.course.findMany({
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
  const totalStudents = activeCohorts.reduce((acc, curr) => acc + curr._count.enrollments, 0)

  // 4. Pending Grades
  const pendingGradesCount = await prisma.grade.count({
    where: {
      gradedBy: instructorId,
      score: 0,
    },
  })

  // 5. Recent Notices
  const recentNotices = await prisma.newsArticle.findMany({
    where: {
      status: 'PUBLISHED',
    },
    orderBy: {
      publishedAt: 'desc',
    },
    take: 3,
    select: {
      id: true,
      title: true,
      publishedAt: true,
      slug: true,
    },
  })

  // 6. Pending Grading Details
  const pendingGradingDetails = await prisma.grade.findMany({
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
    recentNotices,
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

  const instructorId = await getInstructorId(session.user.id)
  const now = new Date()
  const rangeStart = startDate || startOfWeek(now, { weekStartsOn: 1 })
  const rangeEnd = endDate || endOfWeek(now, { weekStartsOn: 1 })

  return serializePrisma(
    await prisma.class.findMany({
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

  const instructorId = await getInstructorId(session.user.id)

  const updatedGrade = await prisma.grade.update({
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

  const instructorId = await getInstructorId(session.user.id)

  return await prisma.grade.count({
    where: {
      gradedBy: instructorId,
      score: 0,
    },
  })
}

export async function getGradingQueue() {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return []

  const instructorId = await getInstructorId(session.user.id)

  return serializePrisma(
    await prisma.grade.findMany({
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

  const instructorId = await getInstructorId(session.user.id)

  return serializePrisma(
    await prisma.grade.findMany({
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

  const instructorId = await getInstructorId(session.user.id)

  return serializePrisma(
    await prisma.class.findMany({
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

export async function getClassAttendance(classId: string, date?: Date) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return null

  const instructorId = await getInstructorId(session.user.id)
  const classData = await prisma.class.findUnique({
    where: { id: classId, instructorId },
    include: {
      course: {
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            include: { user: { include: { profile: true } } },
          },
        },
      },
    },
  })

  if (!classData) throw new Error('Class not found or unauthorized')

  const targetDate = date || new Date()

  const records = await prisma.attendanceRecord.findMany({
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
  status: string
  notes?: string
}) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') {
    throw new Error('Unauthorized')
  }

  const instructorId = await getInstructorId(session.user.id)

  return serializePrisma(
    await prisma.attendanceRecord.upsert({
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
    await prisma.course.findUnique({
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

  const instructorId = await getInstructorId(session.user.id)

  // 1. Fetch assigned courses (Dynamic Academic Resources)
  const assignedCourses = await prisma.course.findMany({
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
  const generalResources = await prisma.generalResource.findMany({
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

  const instructorId = await getInstructorId(session.user.id)

  const enrollments = await prisma.enrollment.findMany({
    where: {
      course: {
        classes: {
          some: { instructorId },
        },
      },
      status: 'ACTIVE',
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

export async function getStudentDetails(userId: string) {
  const session = await getAuthSession()
  if (!session || session.user.role !== 'INSTRUCTOR') return null

  const instructorId = await getInstructorId(session.user.id)

  const student = await prisma.user.findUnique({
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
