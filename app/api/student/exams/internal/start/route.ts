import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import {
  buildRandomizedPaper,
  checkEligibility,
  getBankRules,
  isInternalExamSystemEnabled,
  selectInternalExamQuestions,
} from '@/lib/internal-exam/engine'
import {
  categoryMatchesTarget,
  getInternalBankCategoryCode,
  getStudentTargetCategoryCodes,
  normalizeCategoryCode,
} from '@/lib/easa/category-selection'
import { isSEBRequest } from '@/lib/middleware/seb-detection'
import { SebValidationError, validateSebRequest } from '@/lib/middleware/seb-validation'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { rateLimitByUser } from '@/lib/security/rate-limit'
import { z } from 'zod'

interface QuestionOrderEntry {
  id: string
  [key: string]: unknown
}

const startSchema = z.object({
  bankId: z.string().min(1),
  categoryCode: z.string().optional(),
  classId: z.string().optional(),
})

// POST /api/student/exams/internal/start — start a new exam session
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const user = await prismaUnfiltered.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (!user || user.role !== 'STUDENT') {
    return apiError('Only enrolled students may take internal exams', 403)
  }

  // Rate limit: 5 exam starts per minute per user
  const rateLimitResult = rateLimitByUser(session.user.id, 5, 60000)
  if (!rateLimitResult.allowed) {
    return apiError('Too many exam start requests. Please wait a moment and try again.', 429)
  }

  const body = await req.json()
  const parsed = startSchema.safeParse(body)
  if (!parsed.success) {
    return apiError('Invalid request body', 400)
  }
  const { bankId, categoryCode: requestedCategoryCode, classId } = parsed.data

  // Verify the bank exists and get the course it belongs to
  const bank = await prismaUnfiltered.internalExamBank.findUnique({
    where: { id: bankId },
    select: {
      id: true,
      mcqCount: true,
      ruleSet: true,
      courseId: true,
      isActive: true,
      categoryCode: true,
      categoryConfig: true,
      reviewState: true,
    },
  })
  if (!bank) return apiError('Exam bank not found', 404)
  if (!bank.isActive) return apiError('This exam bank is not currently active', 403)
  if (bank.reviewState !== 'APPROVED') {
    return apiError('This exam bank has not been approved for student use', 403)
  }

  // Verify student is enrolled in the course this bank belongs to
  const enrollment = await prismaUnfiltered.enrollment.findFirst({
    where: {
      userId: session.user.id,
      courseId: bank.courseId,
      status: { in: ['ENROLLED', 'ACTIVE', 'APPROVED'] },
    },
  })
  if (!enrollment) {
    return apiError('You must be enrolled in the course to take this exam', 403)
  }

  const targetCategories = await getStudentTargetCategoryCodes(prismaUnfiltered, session.user.id)
  const bankCategoryCode = getInternalBankCategoryCode(bank)
  const selectedCategoryCode = normalizeCategoryCode(requestedCategoryCode) || bankCategoryCode

  if (bankCategoryCode && selectedCategoryCode !== bankCategoryCode) {
    return apiError(`This exam bank is configured for category ${bankCategoryCode}.`, 400)
  }
  if (selectedCategoryCode && !categoryMatchesTarget(selectedCategoryCode, targetCategories)) {
    return apiError(
      `Category ${selectedCategoryCode} is not part of your selected licence pathway.`,
      403
    )
  }

  // Class-schedule validation if classId is provided
  let schedule = null
  if (classId) {
    const cls = await prismaUnfiltered.class.findUnique({
      where: { id: classId },
      select: { id: true },
    })
    if (!cls) return apiError('Class not found', 404)

    schedule = await prismaUnfiltered.internalExamClassSchedule.findFirst({
      where: { bankId, classId },
    })
    if (!schedule) return apiError('No exam schedule found for this class', 403)

    if (!schedule.isActive) {
      return apiError('This exam schedule is not active', 403)
    }

    const now = new Date()
    if (schedule.scheduledStart && now < schedule.scheduledStart) {
      return apiError('Exam has not started yet', 403)
    }

    const effectiveEnd =
      schedule.allowLateStart && schedule.scheduledEnd
        ? new Date(schedule.scheduledEnd.getTime() + 15 * 60 * 1000)
        : schedule.scheduledEnd

    if (effectiveEnd && now > effectiveEnd) {
      return apiError('Exam not available outside scheduled window', 403)
    }

    if (schedule.sebRequired && !isSEBRequest(req)) {
      return apiError('This exam requires Safe Exam Browser', 403)
    }
  }

  const userRecord = await prismaUnfiltered.user.findUnique({
    where: { id: session.user.id },
    select: { requiresAlternativeProctoring: true, email: true },
  })

  if (userRecord?.requiresAlternativeProctoring) {
    if (classId) {
      const eligibility = await checkEligibility(session.user.id, bankId)
      if (!eligibility.eligible) {
        return apiError(eligibility.reason || 'Not eligible', 403)
      }

      const rules = await getBankRules(bankId)
      const questionIds = await selectInternalExamQuestions(bankId, bank.mcqCount)
      if (questionIds.length === 0) {
        return apiError('No questions available in this exam bank')
      }

      const totalTimeSecs = questionIds.length * rules.timePerQuestionSecs
      const expiresAt = new Date(Date.now() + totalTimeSecs * 1000)

      const supervisedSession = await prismaUnfiltered.internalExamSession.create({
        data: {
          studentId: session.user.id,
          bankId,
          classId,
          ruleSet: bank.ruleSet,
          status: 'NOT_STARTED',
          supervised: true,
          expiresAt,
          attemptNumber: 'attemptNumber' in eligibility ? eligibility.attemptNumber : 1,
          categoryCode: selectedCategoryCode,
        },
      })

      if (schedule?.sebRequired) {
        try {
          await validateSebRequest(supervisedSession.id, req)
        } catch (err) {
          if (err instanceof SebValidationError) {
            return apiError(err.message, err.statusCode)
          }
          throw err
        }
      }

      await prismaUnfiltered.internalExamAnswer.createMany({
        data: questionIds.map((qId) => ({
          sessionId: supervisedSession.id,
          questionId: qId,
        })),
      })

      await createAuditLog({
        action: AuditAction.EXAM_SESSION_STARTED,
        userId: session.user.id,
        entity: 'InternalExamSession',
        entityId: supervisedSession.id,
        description: `Supervised exam session prepared for candidate requiring alternative proctoring`,
        details: {
          bankId,
          classId,
          studentEmail: userRecord.email,
          questionCount: questionIds.length,
        },
      })

      return apiSuccess({
        supervised: true,
        sessionId: supervisedSession.id,
        message: 'Your invigilator will start this exam for you. Please wait.',
      })
    }

    return apiError('Supervised exams require a scheduled class', 400)
  }

  // Check for an existing NOT_STARTED placeholder session first (reuse it)
  if (classId) {
    const placeholderSession = await prismaUnfiltered.internalExamSession.findFirst({
      where: {
        studentId: session.user.id,
        bankId,
        classId,
        status: 'NOT_STARTED',
      },
    })
    if (placeholderSession) {
      const allQuestions = await prismaUnfiltered.internalExamQuestion.findMany({
        where: {
          answers: { some: { sessionId: placeholderSession.id } },
        },
        select: { id: true, text: true, options: true, points: true, subTopic: true },
      })
      const savedAnswers = await prismaUnfiltered.internalExamAnswer.findMany({
        where: { sessionId: placeholderSession.id },
        select: { id: true, selectedAnswer: true, flaggedForReview: true },
      })
      const rules = await getBankRules(bankId)

      // Apply stored question order if present
      let questions = allQuestions
      if (placeholderSession.questionOrder && Array.isArray(placeholderSession.questionOrder)) {
        const order = placeholderSession.questionOrder as QuestionOrderEntry[]
        const orderMap = new Map(order.map((q) => [q.id, q]))
        questions = order
          .map((q) => allQuestions.find((aq) => aq.id === q.id))
          .filter((q): q is NonNullable<(typeof allQuestions)[number]> => q != null)
      }

      return apiSuccess({
        sessionId: placeholderSession.id,
        questions,
        savedAnswers,
        resumed: true,
        totalTimeSecs: placeholderSession.expiresAt
          ? Math.max(0, Math.floor((placeholderSession.expiresAt.getTime() - Date.now()) / 1000))
          : 0,
        expiresAt: placeholderSession.expiresAt?.toISOString(),
        rules: {
          timePerQuestionSecs: rules.timePerQuestionSecs,
          passMarkPct: rules.passMarkPct,
          allowKeyboardAutoSubmit: rules.allowKeyboardAutoSubmit,
        },
      })
    }
  }

  // Check for an existing in-progress session (allow resume)
  const existingSessionWhere: Prisma.InternalExamSessionWhereInput = {
    studentId: session.user.id,
    bankId,
    status: 'IN_PROGRESS',
  }
  if (classId) {
    existingSessionWhere.classId = classId
  }

  const existingSession = await prismaUnfiltered.internalExamSession.findFirst({
    where: existingSessionWhere,
  })
  if (existingSession) {
    const allQuestions = await prismaUnfiltered.internalExamQuestion.findMany({
      where: {
        answers: { some: { sessionId: existingSession.id } },
      },
      select: { id: true, text: true, options: true, points: true, subTopic: true },
    })
    const savedAnswers = await prismaUnfiltered.internalExamAnswer.findMany({
      where: { sessionId: existingSession.id },
      select: { questionId: true, selectedAnswer: true },
    })
    const rules = await getBankRules(bankId)

    // Apply stored question order if present
    let questions = allQuestions
    if (existingSession.questionOrder && Array.isArray(existingSession.questionOrder)) {
      const order = existingSession.questionOrder as QuestionOrderEntry[]
      const orderMap = new Map(order.map((q) => [q.id, q]))
      questions = order
        .map((q) => allQuestions.find((aq) => aq.id === q.id))
        .filter((q): q is NonNullable<(typeof allQuestions)[number]> => q != null)
    }

    return apiSuccess({
      sessionId: existingSession.id,
      questions,
      savedAnswers,
      resumed: true,
      totalTimeSecs: existingSession.expiresAt
        ? Math.max(0, Math.floor((existingSession.expiresAt.getTime() - Date.now()) / 1000))
        : 0,
      expiresAt: existingSession.expiresAt?.toISOString(),
      rules: {
        timePerQuestionSecs: rules.timePerQuestionSecs,
        passMarkPct: rules.passMarkPct,
        allowKeyboardAutoSubmit: rules.allowKeyboardAutoSubmit,
      },
    })
  }

  // Check retake eligibility
  const eligibility = await checkEligibility(session.user.id, bankId)
  if (!eligibility.eligible) {
    return apiError(eligibility.reason || 'Not eligible', 403)
  }

  const rules = await getBankRules(bankId)

  // Select questions
  const questionIds = await selectInternalExamQuestions(bankId, bank.mcqCount)
  if (questionIds.length === 0) {
    return apiError('No questions available in this exam bank')
  }

  // Fetch full question data for randomised paper assembly
  const rawQuestions = await prismaUnfiltered.internalExamQuestion.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      text: true,
      options: true,
      points: true,
      subTopic: true,
      syllabusRef: true,
    },
  })

  // Build randomised paper (shuffled question order + shuffled options)
  const { paper: randomisedQuestions, questionOrder } = await buildRandomizedPaper(
    rawQuestions.map((q) => ({
      ...q,
      options: Array.isArray(q.options)
        ? q.options.filter((o): o is string => typeof o === 'string')
        : [],
    }))
  )

  // Calculate expiry time
  const totalTimeSecs = questionIds.length * rules.timePerQuestionSecs
  const expiresAt = new Date(Date.now() + totalTimeSecs * 1000)

  // Create session with randomised question order
  const examSession = await prismaUnfiltered.internalExamSession.create({
    data: {
      studentId: session.user.id,
      bankId,
      classId: classId || null,
      ruleSet: bank.ruleSet,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      expiresAt,
      questionOrder,
      attemptNumber: 'attemptNumber' in eligibility ? eligibility.attemptNumber : 1,
      categoryCode: selectedCategoryCode,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
      userAgent: req.headers.get('user-agent') || null,
    },
  })

  if (schedule?.sebRequired) {
    try {
      await validateSebRequest(examSession.id, req)
    } catch (err) {
      if (err instanceof SebValidationError) {
        return apiError(err.message, err.statusCode)
      }
      throw err
    }
  }

  // Create blank answer records in randomised order
  await prismaUnfiltered.internalExamAnswer.createMany({
    data: questionOrder.map((qId: string) => ({
      sessionId: examSession.id,
      questionId: qId,
    })),
  })

  return apiSuccess({
    sessionId: examSession.id,
    questions: randomisedQuestions,
    savedAnswers: [],
    resumed: false,
    totalTimeSecs,
    expiresAt: expiresAt.toISOString(),
    rules: {
      timePerQuestionSecs: rules.timePerQuestionSecs,
      passMarkPct: rules.passMarkPct,
      allowKeyboardAutoSubmit: rules.allowKeyboardAutoSubmit,
    },
  })
})
