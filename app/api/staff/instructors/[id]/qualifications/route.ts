import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiCreated, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { z } from 'zod'

const qualSchema = z.object({
  qualificationType: z.string().min(1),
  issuedBy: z.string().min(1),
  issueDate: z.string(),
  expiryDate: z.string().optional(),
  notes: z.string().optional(),
})

export const POST = withErrorHandler(async (req: NextRequest, ctx: any) => {
  await requireStaff()
  const { id } = await ctx.params
  const body = await req.json()
  const parsed = qualSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const qual = await prismaUnfiltered.instructorQualification.create({
    data: {
      instructorId: id,
      qualificationType: parsed.data.qualificationType,
      issuedBy: parsed.data.issuedBy,
      issueDate: new Date(parsed.data.issueDate),
      expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null,
      notes: parsed.data.notes || null,
    },
  })

  return apiCreated(qual)
})
