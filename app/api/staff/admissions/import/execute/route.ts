import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'
const PROGRAMMES = ['FULL_TIME_4YEAR', 'FULL_TIME_2YEAR', 'MILITARY_1YEAR', 'MODULAR', 'EXAM_ONLY'] as const
const STAGES = ['REGISTERED', 'PAYMENT_PENDING', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED', 'APTITUDE_PENDING', 'APTITUDE_COMPLETED', 'SHORTLISTED', 'INTERVIEW_PENDING', 'INTERVIEW_SCHEDULED', 'INTERVIEW_COMPLETED', 'SELECTED', 'MEDICAL_PENDING', 'MEDICAL_SUBMITTED', 'MEDICAL_CLEARED', 'ENROLLED', 'REJECTED', 'WITHDRAWN'] as const

const rowSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  programmeChoice: z.enum(PROGRAMMES),
  stage: z.enum(STAGES).optional().default('REGISTERED'),
  customFields: z.record(z.string(), z.string()).optional()
}).passthrough()

export const POST = withErrorHandler(async (req: NextRequest, _ctx: any) => {
  await requireStaff()
  
  const body = await req.json()
  if (!Array.isArray(body.validRows)) return apiError('Invalid input: validRows must be an array')

  let importedCount = 0
  const errors: string[] = []

  for (let i = 0; i < body.validRows.length; i++) {
    const raw = body.validRows[i]
    const parsed = rowSchema.safeParse(raw)
    
    if (!parsed.success) {
      errors.push(`Row ${i}: Invalid data`)
      continue
    }
    
    const data = parsed.data

    try {
      await prismaUnfiltered.$transaction(async (tx: any) => {
        // 1. Find or create user
        let user = await tx.user.findUnique({ where: { email: data.email } })
        if (!user) {
          user = await tx.user.create({
            data: {
              email: data.email,
              name: `${data.firstName} ${data.lastName}`,
              firstName: data.firstName,
              lastName: data.lastName,
              phone: data.phone,
            }
          })
        }

        // 2. Create application
        const app = await tx.application.create({
          data: {
            userId: user.id,
            programmeChoice: data.programmeChoice,
            stage: data.stage,
            fundingType: 'SELF_FUNDED'
          }
        })

        // 3. Create Student Profile if enrolled
        if (data.stage === 'ENROLLED') {
          let studentId = ''
          let unique = false
          while (!unique) {
            const rand = Math.floor(1000 + Math.random() * 9000).toString()
            studentId = `AATA-${rand}`
            const check = await tx.studentProfile.findUnique({ where: { studentId } })
            if (!check) unique = true
          }
          await tx.studentProfile.create({
            data: {
              userId: user.id,
              studentId,
              enrollmentStatus: 'ENROLLED',
              programmeChoice: data.programmeChoice,
            }
          })
        }

        // 4. Handle custom fields
        if (data.customFields) {
          for (const [slug, value] of Object.entries(data.customFields)) {
            const def = await tx.customFieldDefinition.findUnique({ where: { slug } })
            if (def) {
              await tx.customFieldValue.create({
                data: {
                  fieldDefinitionId: def.id,
                  entityId: app.id,
                  entityType: 'APPLICATION',
                  value: String(value)
                }
              })
            }
          }
        }
      })
      importedCount++
    } catch (e: any) {
      errors.push(`Row ${i} (${data.email}): ${e.message}`)
    }
  }

  return apiSuccess({ importedCount, errors })
})
