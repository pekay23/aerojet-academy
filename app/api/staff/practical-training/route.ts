import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler, RouteContext } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

const MAX_STUDENTS_PER_SESSION = 15

const recordSchema = z.object({
  studentProfileId: z.string(),
  courseId: z.string(),
  classId: z.string().optional(),
  taskCategory: z.enum(['P1', 'P2']),
  taskReference: z.string().optional(),
  ataChapterId: z.string().optional(),
  description: z.string().min(1),
  deliveryMethod: z.enum(['TASK_PERFORMANCE', 'DEMONSTRATION', 'TECHNICAL_DISCUSSION', 'SIMULATION']),
  date: z.string(),
  durationMinutes: z.number().min(15),
  instructorId: z.string(),
  assessorId: z.string().optional(),
  result: z.enum(['SATISFACTORY', 'UNSATISFACTORY', 'NEEDS_REVIEW']).optional(),
  assessorNotes: z.string().optional(),
})

// GET — list practical training records
export const GET = withErrorHandler(async (req: NextRequest, _ctx?: RouteContext) => {
  await requireStaff()
  const url = new URL(req.url)
  let studentProfileId = url.searchParams.get('studentProfileId')
  const userId = url.searchParams.get('userId')
  if (!studentProfileId && userId) {
    const sp = await prismaUnfiltered.studentProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    if (sp) studentProfileId = sp.id
  }
  const courseId = url.searchParams.get('courseId')
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '50')

  const where: any = {}
  if (studentProfileId) where.studentProfileId = studentProfileId
  if (courseId) where.courseId = courseId

  const [records, total] = await Promise.all([
    prismaUnfiltered.practicalTrainingRecord.findMany({
      where,
      include: {
        ataChapter: { select: { code: true, title: true } },
        course: { select: { name: true, code: true } },
        instructor: { select: { profile: { select: { firstName: true, lastName: true } } } },
        studentProfile: {
          select: {
            studentId: true,
            user: { select: { profile: { select: { firstName: true, lastName: true } } } },
          },
        },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prismaUnfiltered.practicalTrainingRecord.count({ where }),
  ])

  // ATA coverage analysis
  let ataCoverage = null
  if (studentProfileId) {
    const allChapters = await prismaUnfiltered.aTAChapter.findMany({
      where: { isActive: true },
      select: { id: true, code: true, title: true, category: true },
      orderBy: { sortOrder: 'asc' },
    })

    const completedChapterIds = new Set(
      records.filter(r => r.ataChapterId && r.result === 'SATISFACTORY').map(r => r.ataChapterId!)
    )

    ataCoverage = {
      total: allChapters.length,
      completed: completedChapterIds.size,
      percent: allChapters.length > 0 ? Math.round((completedChapterIds.size / allChapters.length) * 100) : 0,
      chapters: allChapters.map(ch => ({
        ...ch,
        completed: completedChapterIds.has(ch.id),
      })),
    }
  }

  return apiSuccess({ records, total, page, limit, ataCoverage })
})

// POST — create practical training record
export const POST = withErrorHandler(async (req: NextRequest, _ctx?: RouteContext) => {
  await requireStaff()
  const body = await req.json()
  const parsed = recordSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  // Enforce 15-student max per instructor per session
  const sessionDate = new Date(parsed.data.date)
  const dayStart = new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate())
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  const studentsToday = await prismaUnfiltered.practicalTrainingRecord.findMany({
    where: {
      instructorId: parsed.data.instructorId,
      date: { gte: dayStart, lt: dayEnd },
    },
    select: { studentProfileId: true },
    distinct: ['studentProfileId'],
  })

  if (studentsToday.length >= MAX_STUDENTS_PER_SESSION &&
      !studentsToday.some(s => s.studentProfileId === parsed.data.studentProfileId)) {
    return apiError(`Maximum ${MAX_STUDENTS_PER_SESSION} students per instructor per day`, 400)
  }

  const record = await prismaUnfiltered.practicalTrainingRecord.create({
    data: {
      studentProfileId: parsed.data.studentProfileId,
      courseId: parsed.data.courseId,
      classId: parsed.data.classId || null,
      taskCategory: parsed.data.taskCategory as any,
      taskReference: parsed.data.taskReference || null,
      ataChapterId: parsed.data.ataChapterId || null,
      description: parsed.data.description,
      deliveryMethod: parsed.data.deliveryMethod as any,
      date: sessionDate,
      durationMinutes: parsed.data.durationMinutes,
      instructorId: parsed.data.instructorId,
      assessorId: parsed.data.assessorId || null,
      result: (parsed.data.result as any) || null,
      assessorNotes: parsed.data.assessorNotes || null,
    },
  })

  return apiCreated(record)
})
