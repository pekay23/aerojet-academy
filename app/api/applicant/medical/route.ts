import { NextRequest } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, withErrorHandler } from '@/lib/api/response'
import { prismaUnfiltered } from '@/lib/prisma/client'

export const GET = withErrorHandler(async (_req: NextRequest, _ctx: any) => {
  const session = await getAuthSession()
  if (!session?.user?.id) return apiError('Unauthorized', 401)

  const app = await prismaUnfiltered.application.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      stage: true,
      medicalStatus: true,
      medicalClearedAt: true,
      medicalFacility: true,
      medicalNotes: true,
      documents: {
        where: {
          documentType: { slug: { contains: 'medical' } },
        },
        include: {
          documentType: { select: { id: true, name: true, slug: true } },
          fileUpload: { select: { url: true, fileName: true } },
        },
      },
    },
  })

  if (!app) return apiError('No application found', 404)

  // Only return data if user is in a medical-related stage
  const medicalStages = ['MEDICAL_PENDING', 'MEDICAL_SUBMITTED', 'MEDICAL_CLEARED', 'ENROLLED']
  if (!medicalStages.includes(app.stage)) {
    return apiError('Medical stage not active', 400)
  }

  // Get medical doc types
  const medicalDocTypes = await prismaUnfiltered.applicationDocumentType.findMany({
    where: { slug: { contains: 'medical' }, isActive: true },
    select: { id: true, name: true, slug: true },
  })

  return apiSuccess({
    stage: app.stage,
    medicalStatus: app.medicalStatus,
    medicalClearedAt: app.medicalClearedAt,
    medicalFacility: app.medicalFacility,
    medicalNotes: app.medicalNotes,
    documents: app.documents,
    medicalDocTypes,
    applicationId: app.id,
  })
})
