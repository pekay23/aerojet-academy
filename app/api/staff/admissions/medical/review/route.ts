import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { transitionApplication } from '@/lib/admissions/state-machine'
import { ApplicationStage, MedicalStatus } from '@prisma/client'
import { z } from 'zod'

const MEDICAL_STATUSES = ['CLEARED', 'FAILED', 'EXEMPTED'] as const
const reviewSchema = z.object({
  applicationId: z.string(),
  decision: z.enum(MEDICAL_STATUSES),
  notes: z.string().optional(),
  facility: z.string().optional(),
})

export const POST = withErrorHandler(async (req: NextRequest, _ctx: unknown) => {
  const staff = await requireStaff()

  const body = await req.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) return apiError('Invalid input')

  const { applicationId, decision, notes, facility } = parsed.data

  // Load current application
  const app = await prismaUnfiltered.application.findUnique({
    where: { id: applicationId },
    include: { user: { select: { id: true, email: true } } },
    // fundingType is a scalar field on Application, included by default
  })
  if (!app) return apiError('Application not found', 404)
  if (app.stage !== 'MEDICAL_SUBMITTED' && app.stage !== 'MEDICAL_PENDING') {
    return apiError(`Application is in stage ${app.stage}, cannot review medical`)
  }

  // Update medical fields
  await prismaUnfiltered.application.update({
    where: { id: applicationId },
    data: {
      medicalStatus: decision as MedicalStatus,
      medicalNotes: notes || null,
      medicalFacility: facility || null,
      ...(decision === 'CLEARED' || decision === 'EXEMPTED'
        ? { medicalClearedAt: new Date(), medicalClearedBy: staff.id }
        : {}),
    },
  })

  // Transition based on decision
  if (decision === 'CLEARED' || decision === 'EXEMPTED') {
    const result = await transitionApplication(
      applicationId,
      ApplicationStage.MEDICAL_CLEARED,
      staff.id,
      { metadata: { medicalDecision: decision, reviewedBy: staff.id } }
    )
    if (!result.success) return apiError(result.error || 'Transition failed')

    // Auto-enroll if MEDICAL_CLEARED is the last pre-enrollment stage
    const enrollResult = await transitionApplication(
      applicationId,
      ApplicationStage.ENROLLED,
      staff.id,
      { metadata: { autoEnrolled: true, trigger: 'medical_cleared' } }
    )

    if (enrollResult.success) {
      // Create StudentProfile on enrollment
      const existing = await prismaUnfiltered.studentProfile.findUnique({
        where: { userId: app.userId },
      })
      if (!existing) {
        // Generate unique student ID
        let studentId = ''
        let unique = false
        while (!unique) {
          const rand = Math.floor(1000 + Math.random() * 9000).toString()
          studentId = `AATA-${rand}`
          const check = await prismaUnfiltered.studentProfile.findUnique({ where: { studentId } })
          if (!check) unique = true
        }

        await prismaUnfiltered.studentProfile.create({
          data: {
            userId: app.userId,
            studentId,
            enrollmentStatus: 'ENROLLED',
            enrollmentDate: new Date(),
            programmeChoice: app.programmeChoice,
          },
        })
      }

      // Auto-create BondingContract for SCHOLARSHIP students
      if (app.fundingType === 'SCHOLARSHIP') {
        const existingContract = await prismaUnfiltered.bondingContract.findUnique({
          where: { applicationId: app.id },
        })
        if (!existingContract) {
          const sp = await prismaUnfiltered.studentProfile.findUnique({
            where: { userId: app.userId },
          })
          await prismaUnfiltered.bondingContract.create({
            data: {
              applicationId: app.id,
              studentProfileId: sp?.id || null,
              status: 'ISSUED',
            },
          })
        }
      }

      // Update user role to STUDENT
      await prismaUnfiltered.user.update({
        where: { id: app.userId },
        data: { role: 'STUDENT' },
      })
    }

    return apiSuccess({ decision, enrolled: enrollResult.success })
  } else {
    // FAILED — reject the application
    const result = await transitionApplication(
      applicationId,
      ApplicationStage.REJECTED,
      staff.id,
      { rejectionReason: `Medical examination failed: ${notes || 'No details provided'}` }
    )
    return apiSuccess({ decision, rejected: result.success })
  }
})
