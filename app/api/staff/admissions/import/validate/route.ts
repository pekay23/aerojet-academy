import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler, RouteContext } from '@/lib/api/response'
import { z, type ZodIssue } from 'zod'
const PROGRAMMES = ['FULL_TIME_4YEAR', 'FULL_TIME_2YEAR', 'MILITARY_1YEAR', 'MODULAR', 'EXAM_ONLY'] as const
const STAGES = ['REGISTERED', 'PAYMENT_PENDING', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'APTITUDE_PENDING', 'APTITUDE_COMPLETED', 'SHORTLISTED', 'INTERVIEW_PENDING', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'SELECTED', 'MEDICAL_PENDING', 'MEDICAL_SUBMITTED', 'MEDICAL_CLEARED', 'ENROLLED', 'REJECTED', 'WITHDRAWN'] as const

const rowSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  programmeChoice: z.enum(PROGRAMMES),
  stage: z.enum(STAGES).optional().default('REGISTERED'),
  customFields: z.record(z.string(), z.string()).optional()
}).passthrough()

export const POST = withErrorHandler(async (req: NextRequest, _ctx: RouteContext) => {
  await requireStaff()
  
  const body = await req.json() as { rows: unknown[] }
  if (!Array.isArray(body.rows)) return apiError('Invalid input: rows must be an array')

  const results = body.rows.map((row: unknown, index: number) => {
    const parseRes = rowSchema.safeParse(row)
    if (parseRes.success) {
      return { row: index, valid: true, data: parseRes.data }
    } else {
      return { 
        row: index, 
        valid: false, 
        errors: parseRes.error.issues.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`) 
      }
    }
  })

  return apiSuccess({ results })
})
