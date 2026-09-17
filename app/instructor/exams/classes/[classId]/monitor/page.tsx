import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireInstructor } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import ClassMonitorPage from './_components/ClassMonitorPage'

export const metadata: Metadata = { title: 'Live Monitor | Instructor Portal' }
export const dynamic = 'force-dynamic'

export interface MonitorClassInfo {
  id: string
  name: string
  courseName: string
  courseCode: string
  enrolledCount: number
  startDate: string
  endDate: string
}

export interface MonitorSessionRow {
  id: string
  status: string
  student: { id: string; name: string; email: string }
  bank: { id: string; name: string }
  startedAt: string | null
  expiresAt: string | null
  submittedAt: string | null
  score: number | null
  totalPoints: number | null
  percentage: number | null
  passed: boolean | null
  correctCount: number
  timeRemaining: number | null
  answerCount: number
  answers: {
    question: { id: string; text: string; correctAnswer: string; points: number } | null
    selectedAnswer: string | null
    pointsAwarded: number | null
    isCorrect: boolean | null
    answeredAt: string | null
  }[]
}

async function getMonitorSessions(classId: string): Promise<MonitorSessionRow[]> {
  const now = new Date()
  const sessions = await prismaUnfiltered.internalExamSession.findMany({
    where: { classId },
    include: {
      student: {
        select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } },
      },
      bank: { select: { id: true, name: true } },
      answers: {
        include: {
          question: { select: { id: true, correctAnswer: true, points: true, text: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return sessions.map((s) => {
    let correctCount = 0
    let totalPoints = 0
    for (const answer of s.answers) {
      if (answer.question) {
        totalPoints += answer.question.points
        if (
          answer.selectedAnswer !== null &&
          answer.selectedAnswer === answer.question.correctAnswer
        ) {
          correctCount++
        }
      }
    }
    const timeRemaining =
      s.status === 'IN_PROGRESS' && s.expiresAt
        ? Math.max(0, Math.floor((s.expiresAt.getTime() - now.getTime()) / 1000))
        : null

    return {
      id: s.id,
      status: s.status,
      student: {
        id: s.student.id,
        name:
          `${s.student.profile?.firstName || ''} ${s.student.profile?.lastName || ''}`.trim() ||
          s.student.email,
        email: s.student.email,
      },
      bank: s.bank,
      startedAt: s.startedAt?.toISOString() || null,
      expiresAt: s.expiresAt?.toISOString() || null,
      submittedAt: s.submittedAt?.toISOString() || null,
      score: s.score,
      totalPoints: s.totalPoints ?? totalPoints,
      percentage: s.percentage,
      passed: s.passed,
      correctCount,
      timeRemaining,
      answerCount: s.answers.length,
      answers: s.answers.map((a) => ({
        question: a.question,
        selectedAnswer: a.selectedAnswer,
        pointsAwarded: a.pointsAwarded,
        isCorrect: a.isCorrect,
        answeredAt: a.answeredAt?.toISOString() || null,
      })),
    }
  })
}

export default async function ClassMonitorPageServer({
  params,
}: {
  params: Promise<{ classId: string }>
}) {
  const user = await requireInstructor()
  const instructorProfile = await getInstructorProfileByUserId(user.id)
  if (!instructorProfile) notFound()

  const { classId } = await params

  const classItem = await prismaUnfiltered.class.findUnique({
    where: { id: classId },
    select: {
      id: true,
      instructorId: true,
      name: true,
      currentStudents: true,
      startDate: true,
      endDate: true,
      course: { select: { name: true, code: true } },
    },
  })
  if (!classItem) notFound()
  if (classItem.instructorId !== instructorProfile.id) notFound()

  if (!(await isInternalExamSystemEnabled())) {
    return (
      <div className="mx-auto max-w-3xl pb-10">
        <ClassMonitorPage classId={classId} initialClass={null} initialSessions={[]} />
      </div>
    )
  }

  const [initialSessions] = await Promise.all([getMonitorSessions(classId)])

  const initialClass: MonitorClassInfo = {
    id: classItem.id,
    name: classItem.name,
    courseName: classItem.course.name,
    courseCode: classItem.course.code,
    enrolledCount: classItem.currentStudents,
    startDate: classItem.startDate.toISOString(),
    endDate: classItem.endDate.toISOString(),
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 mx-auto max-w-7xl pb-10 duration-700">
      <ClassMonitorPage
        classId={classId}
        initialClass={initialClass}
        initialSessions={initialSessions}
      />
    </div>
  )
}
