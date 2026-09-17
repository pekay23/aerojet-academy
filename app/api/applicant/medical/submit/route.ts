import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { transitionApplication } from '@/lib/admissions/state-machine'
import { ApplicationStage } from '@prisma/client'

export const POST = withErrorHandler(async (_req: NextRequest, _ctx?: {
  params: Promise<Record<string, string | string[]>>
}) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const userId = session.user.id

  // Find application
  const app = await prismaUnfiltered.application.findUnique({
    where: { userId },
  })
  if (!app) return apiError('No application found', 404)

  if (app.stage !== 'MEDICAL_PENDING') {
    return apiError(`Cannot submit medical documents in stage ${app.stage}`)
  }

  // Check that they have uploaded at least one document tagged as medical
  const medicalDocs = await prismaUnfiltered.applicationDocument.findMany({
    where: {
      applicationId: app.id,
      documentType: {
        slug: { contains: 'medical' },
      },
    },
  })

  if (medicalDocs.length === 0) {
    return apiError('Please upload your medical examination documents before submitting')
  }

  // Transition to MEDICAL_SUBMITTED
  const result = await transitionApplication(
    app.id,
    ApplicationStage.MEDICAL_SUBMITTED,
    userId,
    { metadata: { documentsSubmitted: medicalDocs.length } }
  )

  if (!result.success) return apiError(result.error || 'Failed to submit medical documents')

  // Update medicalStatus
  await prismaUnfiltered.application.update({
    where: { id: app.id },
    data: { medicalStatus: 'DOCUMENTS_SUBMITTED' },
  })

  return apiSuccess({ submitted: true })
})
