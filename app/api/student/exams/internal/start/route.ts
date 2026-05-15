import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import {
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

// POST /api/student/exams/internal/start — start a new exam session
export const POST = withErrorHandler(async (req: NextRequest, _ctx: any) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  // Role guard — only students may take internal exams
  const user = await prismaUnfiltered.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })
  if (!user || user.role !== 'STUDENT') {
    return apiError('Only enrolled students may take internal exams', 403)
  }

  const { bankId, categoryCode: requestedCategoryCode } = await req.json()
  if (!bankId) return apiError('bankId is required')

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
    },
  })
  if (!bank) return apiError('Exam bank not found', 404)
  if (!bank.isActive) return apiError('This exam bank is not currently active', 403)

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
    return apiError(`Category ${selectedCategoryCode} is not part of your selected licence pathway.`, 403)
  }

  // Check for an existing in-progress session (allow resume)
  const existingSession = await prismaUnfiltered.internalExamSession.findFirst({
    where: {
      studentId: session.user.id,
      bankId,
      status: 'IN_PROGRESS',
    },
  })
  if (existingSession) {
    // Return the existing session for resume
    const questions = await prismaUnfiltered.internalExamQuestion.findMany({
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

  // Calculate expiry time
  const totalTimeSecs = questionIds.length * rules.timePerQuestionSecs
  const expiresAt = new Date(Date.now() + totalTimeSecs * 1000)

  // Create session
  const examSession = await prismaUnfiltered.internalExamSession.create({
    data: {
      studentId: session.user.id,
      bankId,
      ruleSet: bank.ruleSet,
      status: 'IN_PROGRESS',
      startedAt: new Date(),
      expiresAt,
      attemptNumber: (eligibility as any).attemptNumber || 1,
      categoryCode: selectedCategoryCode,
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null,
      userAgent: req.headers.get('user-agent') || null,
    },
  })

  // Create blank answer records
  await prismaUnfiltered.internalExamAnswer.createMany({
    data: questionIds.map(qId => ({
      sessionId: examSession.id,
      questionId: qId,
    })),
  })

  // Fetch questions for the student (without correct answers)
  const questions = await prismaUnfiltered.internalExamQuestion.findMany({
    where: { id: { in: questionIds } },
    select: {
      id: true,
      text: true,
      options: true,
      points: true,
      subTopic: true,
    },
  })

  return apiSuccess({
    sessionId: examSession.id,
    questions,
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
