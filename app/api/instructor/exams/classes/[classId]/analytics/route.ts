import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireInstructor } from '@/lib/auth/helpers'
import {
  apiPaginated,
  apiError,
  apiForbidden,
  apiNotFound,
  withErrorHandler,
  RouteContext,
} from '@/lib/api/response'
import { parsePagination } from '@/lib/api/response'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { AuditAction, createAuditLog } from '@/lib/audit/logger'
import { Prisma } from '@prisma/client'

const MAX_CSV_ROWS = 1000
const MAX_RANGE_DAYS = 365

function formatDateISO(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function obfuscateStudent(s: { id: string; name: string; email: string }, index: number) {
  const opaqueId = `S-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
  return {
    id: opaqueId,
    name: `Student ${index + 1}`,
    email: '',
  }
}

export const GET = withErrorHandler(async (req: NextRequest, ctx?: RouteContext) => {
  const user = await requireInstructor()
  const instructorProfile = await getInstructorProfileByUserId(user.id)
  if (!instructorProfile) return apiForbidden('Instructor profile not found')

  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }
  const { classId } = (await ctx!.params) as { classId: string }

  const classItem = await prismaUnfiltered.class.findUnique({
    where: { id: classId },
    select: { id: true, instructorId: true },
  })
  if (!classItem) return apiNotFound('Class not found')
  if (classItem.instructorId !== instructorProfile.id) {
    return apiForbidden('Not assigned to this class')
  }

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format')
  const { page, limit, skip } = parsePagination(searchParams)
  const includePii = searchParams.get('includePii') === 'true'

  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const dateFilter: Record<string, Date> = {}
  if (from) dateFilter.gte = new Date(from)
  if (to) dateFilter.lte = new Date(to)

  if (dateFilter.gte && dateFilter.lte) {
    const diffDays = (dateFilter.lte.getTime() - dateFilter.gte.getTime()) / (1000 * 60 * 60 * 24)
    if (diffDays > MAX_RANGE_DAYS) {
      return apiError(`Date range exceeds maximum allowed span of ${MAX_RANGE_DAYS} days`, 400)
    }
  }

  const hasDateFilter = Object.keys(dateFilter).length > 0

  const sessionsWhere: Prisma.InternalExamSessionWhereInput = {
    classId,
    status: { in: ['COMPLETED', 'TIMED_OUT'] },
  }
  if (hasDateFilter) sessionsWhere.submittedAt = dateFilter

  const [
    totalAttempts,
    completedSessions,
    passedSessions,
    avgScoreResult,
    questionStatsRaw,
    correctStatsRaw,
    students,
    studentTotal,
  ] = await Promise.all([
    prismaUnfiltered.internalExamSession.count({
      where: hasDateFilter ? { classId, submittedAt: dateFilter } : { classId },
    }),
    prismaUnfiltered.internalExamSession.count({ where: sessionsWhere }),
    prismaUnfiltered.internalExamSession.count({ where: { ...sessionsWhere, passed: true } }),
    prismaUnfiltered.internalExamSession.aggregate({
      where: { ...sessionsWhere, percentage: { not: null } },
      _avg: { percentage: true },
    }),
    prismaUnfiltered.internalExamAnswer.groupBy({
      by: ['questionId'],
      where: {
        session: {
          classId,
          status: { in: ['COMPLETED', 'TIMED_OUT'] },
          ...(hasDateFilter ? { submittedAt: dateFilter } : {}),
        },
      },
      _count: { _all: true },
    }),
    prismaUnfiltered.internalExamAnswer.groupBy({
      by: ['questionId'],
      where: {
        isCorrect: true,
        session: {
          classId,
          status: { in: ['COMPLETED', 'TIMED_OUT'] },
          ...(hasDateFilter ? { submittedAt: dateFilter } : {}),
        },
      },
      _count: { _all: true },
    }),
    prismaUnfiltered.internalExamSession.findMany({
      where: hasDateFilter ? { classId, submittedAt: dateFilter } : { classId },
      include: {
        student: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        bank: { select: { id: true, name: true } },
      },
      orderBy: { submittedAt: 'desc' },
      take: format === 'csv' ? MAX_CSV_ROWS : limit,
      skip: format === 'csv' ? 0 : skip,
    }),
    prismaUnfiltered.internalExamSession.count({
      where: hasDateFilter ? { classId, submittedAt: dateFilter } : { classId },
    }),
  ])

  const correctMap = new Map(correctStatsRaw.map((c) => [c.questionId, c._count._all]))
  const questionIds = questionStatsRaw.map((q) => q.questionId)
  const questionDetails =
    questionIds.length > 0
      ? await prismaUnfiltered.internalExamQuestion.findMany({
          where: { id: { in: questionIds } },
          select: { id: true, text: true, difficulty: true },
        })
      : []
  const questionDetailMap = new Map(questionDetails.map((qd) => [qd.id, qd]))

  const questionStats = questionStatsRaw.map((q) => {
    const total = q._count._all
    const correct = correctMap.get(q.questionId) || 0
    const detail = questionDetailMap.get(q.questionId)
    return {
      questionId: q.questionId,
      text: detail?.text || 'Unknown question',
      difficulty: detail?.difficulty || 'MEDIUM',
      totalAnswers: total,
      correctAnswers: correct,
      correctPct: total > 0 ? Math.round((correct / total) * 100) : 0,
    }
  })

  const passRate =
    completedSessions > 0 ? Math.round((passedSessions / completedSessions) * 100) : 0
  const completionRate =
    totalAttempts > 0 ? Math.round((completedSessions / totalAttempts) * 100) : 0
  const averageScore = avgScoreResult._avg.percentage
    ? Math.round(avgScoreResult._avg.percentage)
    : null

  const studentDrilldown = students.map((s, idx) => {
    const studentInfo = includePii
      ? {
          id: s.student.id,
          name:
            `${s.student.profile?.firstName || ''} ${s.student.profile?.lastName || ''}`.trim() ||
            s.student.email,
          email: s.student.email,
        }
      : obfuscateStudent({ id: s.student.id, name: s.student.email, email: s.student.email }, idx)
    return {
      id: s.id,
      student: studentInfo,
      bank: s.bank,
      status: s.status,
      score: s.score,
      totalPoints: s.totalPoints,
      percentage: s.percentage,
      passed: s.passed,
      startedAt: s.startedAt ? formatDateISO(s.startedAt) : null,
      submittedAt: s.submittedAt ? formatDateISO(s.submittedAt) : null,
    }
  })

  await createAuditLog({
    userId: user.id,
    action: AuditAction.SYSTEM_UPDATE,
    entity: 'InternalExamSession',
    entityId: classId,
    description: `Instructor exported analytics for class ${classId}`,
    changes: { format: format || 'json', includePii, rowCount: studentDrilldown.length, from, to },
  })

  if (format === 'csv') {
    const headers = [
      'Student ID',
      'Name',
      'Email',
      'Bank',
      'Status',
      'Score',
      'Total Points',
      'Percentage',
      'Passed',
      'Started At',
      'Submitted At',
    ]
    const rows = studentDrilldown.map((s) => [
      s.student.id,
      s.student.name,
      s.student.email,
      s.bank.name,
      s.status,
      s.score ?? '',
      s.totalPoints ?? '',
      s.percentage ?? '',
      s.passed ?? '',
      s.startedAt ?? '',
      s.submittedAt ?? '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row
          .map((val) => {
            if (val === null || val === undefined) val = ''
            val = String(val).replace(/"/g, '""')
            if (val.includes(',') || val.includes('"') || val.includes('\n')) {
              return `"${val}"`
            }
            return val
          })
          .join(',')
      ),
    ].join('\n')

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="class-${classId}-analytics.csv"`,
      },
    })
  }

  return apiPaginated(studentDrilldown, studentTotal, page, limit, {
    summary: {
      totalAttempts,
      completedSessions,
      passRate,
      averageScore,
      completionRate,
    },
    questionStats,
  })
})
