import 'server-only'

import { NextRequest } from 'next/server'
import { requireInstructor } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { extractFromTxt, extractFromJson, extractFromDocx, extractFromPdf, detectConfidence } from '@/lib/internal-exam/import/extractors'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { getInstructorProfileByUserId } from '@/lib/instructor/profile'

function questionHash(text: string, options: string[]): string {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim()
  const sorted = [...options].sort()
  return `${normalized}:${JSON.stringify(sorted)}`
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  const user = await requireInstructor()
  const instructorProfile = await getInstructorProfileByUserId(user.id)
  if (!instructorProfile) return apiError('Instructor profile not found', 403)

  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  const body = await req.json()
  const { fileUrl, fileName, bankId } = body as { fileUrl: string; fileName: string; bankId: string }

  const bank = await prismaUnfiltered.internalExamBank.findFirst({
    where: { id: bankId },
    include: { instructorAssignments: { where: { instructorId: user.id } } },
  })
  if (!bank) return apiError('Bank not found', 404)
  const grant = bank.instructorAssignments.find((a) => a.instructorId === user.id)
  if (!grant?.canEdit) return apiError('You do not have permission to import questions into this bank', 403)

  const fileRes = await fetch(fileUrl)
  if (!fileRes.ok) return apiError('Failed to fetch uploaded file', 400)
  const buffer = Buffer.from(await fileRes.arrayBuffer())

  const ext = fileName.split('.').pop()?.toLowerCase()
  let questions
  if (ext === 'txt') questions = await extractFromTxt(buffer.toString())
  else if (ext === 'json') questions = await extractFromJson(buffer.toString())
  else if (ext === 'docx') questions = await extractFromDocx(buffer)
  else if (ext === 'pdf') questions = await extractFromPdf(buffer)
  else return apiError('Unsupported file format', 400)

  const existingQuestions = await prismaUnfiltered.internalExamQuestion.findMany({
    where: { bankId },
    select: { text: true, options: true },
  })
  const existingHashes = new Set(
    existingQuestions.map((q) => {
      const opts = Array.isArray(q.options) ? (q.options as string[]) : []
      return questionHash(q.text, opts)
    })
  )

  const duplicateCount = questions.filter((q) => existingHashes.has(questionHash(q.text, q.options))).length
  const lowConfidenceCount = questions.filter((q) => detectConfidence(q) < 0.5).length

  await createAuditLog({
    userId: user.id,
    action: AuditAction.EXAM_QUESTION_IMPORT,
    entity: 'InternalExamBank',
    entityId: bankId,
    description: `Imported ${questions.length} questions from ${fileName}`,
    changes: { fileName, questionCount: questions.length, lowConfidenceCount, duplicateCount },
  })

  return apiSuccess({ success: true, questions, lowConfidenceCount, duplicateCount })
})
