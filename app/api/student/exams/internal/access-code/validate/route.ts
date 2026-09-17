import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { isInternalExamSystemEnabled } from '@/lib/internal-exam/engine'
import { isSEBRequest } from '@/lib/middleware/seb-detection'
import { z } from 'zod'

const validateSchema = z.object({
  code: z.string().min(4, 'Access code must be at least 4 characters'),
})

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)
  if (!(await isInternalExamSystemEnabled())) {
    return apiError('Internal exams are not currently available', 403)
  }

  if (!isSEBRequest(req)) {
    return apiError('This action requires Safe Exam Browser', 403)
  }

  const body = await req.json()
  const parsed = validateSchema.safeParse(body)
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message || 'Invalid access code', 400)
  }

  const { code } = parsed.data

  const normalizedCode = code.trim().toUpperCase()

  if (normalizedCode.length < 4) {
    return apiError('Invalid access code', 400)
  }

  return apiSuccess({
    valid: true,
    code: normalizedCode,
  })
})
