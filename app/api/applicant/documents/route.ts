import { NextRequest } from 'next/server'
import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiCreated, apiError, withErrorHandler } from '@/lib/api/response'
import { z } from 'zod'

const uploadSchema = z.object({
  documentTypeId: z.string().min(1),
  fileUrl: z.string().url(),
  fileName: z.string().min(1),
  fileSize: z.number().optional(),
  fileType: z.string().optional(),
})

// GET /api/applicant/documents — list applicant's uploaded documents
export const GET = withErrorHandler(async () => {
  const session = await getAuthSession()
  if (!session) return apiError('Unauthorized', 401)

  const application = await prisma.application.findUnique({
    where: { userId: session.user.id },
    select: { id: true, programmeChoice: true },
  })
  if (!application) return apiError('No application found', 404)

  // Get document types applicable to this programme
  const docTypes = await prisma.applicationDocumentType.findMany({
    where: {
      isActive: true,
      OR: [
        { applicableProgrammes: { isEmpty: true } },
        { applicableProgrammes: { has: application.programmeChoice } },
      ],
    },
    orderBy: { sortOrder: 'asc' },
  })

  // Get already uploaded documents
  const uploadedDocs = await prisma.applicationDocument.findMany({
    where: { applicationId: application.id },
    include: {
      documentType: { select: { id: true, name: true, slug: true } },
      fileUpload: { select: { id: true, url: true, filename: true, originalName: true, size: true } },
    },
  })

  return apiSuccess({
    applicationId: application.id,
    programmeChoice: application.programmeChoice,
    documentTypes: docTypes,
    uploadedDocuments: uploadedDocs,
  })
})

// POST /api/applicant/documents — upload/link a document to the application
export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await getAuthSession()
  if (!session) return apiError('Unauthorized', 401)

  const body = await req.json()
  const parsed = uploadSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  const { documentTypeId, fileUrl, fileName, fileSize, fileType } = parsed.data

  const application = await prisma.application.findUnique({
    where: { userId: session.user.id },
    select: { id: true, programmeChoice: true },
  })
  if (!application) return apiError('No application found', 404)

  // Verify document type exists and is applicable
  const docType = await prisma.applicationDocumentType.findUnique({
    where: { id: documentTypeId },
  })
  if (!docType || !docType.isActive) return apiError('Invalid document type', 400)
  if (
    docType.applicableProgrammes.length > 0 &&
    !docType.applicableProgrammes.includes(application.programmeChoice)
  ) {
    return apiError('This document type is not required for your programme', 403)
  }

  // Enforce programme applicability — don't allow uploading docs meant for other programmes
  if (docType.applicableProgrammes.length > 0 && application.programmeChoice) {
    if (!docType.applicableProgrammes.includes(application.programmeChoice)) {
      return apiError('This document type is not applicable to your programme', 400)
    }
  }

  // Server-side file validation
  const allowedTypes = docType.fileTypes.split(',').map((t: string) => t.trim())
  if (fileType && !allowedTypes.includes(fileType)) {
    return apiError(`File type "${fileType}" is not allowed. Accepted: ${docType.fileTypes}`)
  }
  if (fileSize && fileSize > docType.maxSizeMB * 1024 * 1024) {
    return apiError(`File exceeds maximum size of ${docType.maxSizeMB}MB`)
  }

  // Create FileUpload record
  const fileUpload = await prisma.fileUpload.create({
    data: {
      userId: session.user.id,
      url: fileUrl,
      filename: fileName,
      originalName: fileName,
      mimeType: fileType ?? 'application/pdf',
      size: fileSize ?? 0,
      fileType: 'APPLICATION_DOCUMENT',
      referenceType: 'APPLICATION_DOCUMENT',
      referenceId: application.id,
    },
  })

  // Upsert ApplicationDocument (allows re-upload)
  const doc = await prisma.applicationDocument.upsert({
    where: {
      applicationId_documentTypeId: {
        applicationId: application.id,
        documentTypeId,
      },
    },
    create: {
      applicationId: application.id,
      documentTypeId,
      fileUploadId: fileUpload.id,
      status: 'PENDING',
    },
    update: {
      fileUploadId: fileUpload.id,
      status: 'PENDING',
      rejectionReason: null,
      reviewedBy: null,
      reviewedAt: null,
    },
    include: {
      documentType: { select: { id: true, name: true, slug: true } },
      fileUpload: { select: { id: true, url: true, filename: true, originalName: true } },
    },
  })

  return apiCreated(doc)
})
