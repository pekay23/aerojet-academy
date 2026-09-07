import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff, getAuthSession } from '@/lib/auth/helpers'
import { apiSuccess, apiError, apiNotFound, withErrorHandler, RouteContext } from '@/lib/api/response'
import { z } from 'zod'

const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
})

// POST /api/staff/admissions/documents/[id]/review — approve/reject a document
export const POST = withErrorHandler(async (req: NextRequest, ctx: RouteContext) => {
  await requireStaff()
  const session = await getAuthSession()
  const { id } = await ctx.params
  const body = await req.json()
  const parsed = reviewSchema.safeParse(body)
  if (!parsed.success) return apiError(parsed.error.issues[0].message)

  const doc = await prismaUnfiltered.applicationDocument.findUnique({
    where: { id },
    include: {
      application: { select: { id: true, userId: true } },
    },
  })
  if (!doc) return apiNotFound('Document not found')

  const updated = await prismaUnfiltered.applicationDocument.update({
    where: { id },
    data: {
      status: parsed.data.status,
      rejectionReason: parsed.data.status === 'REJECTED' ? parsed.data.rejectionReason : null,
      reviewedBy: session!.user.id,
      reviewedAt: new Date(),
    },
    include: {
      documentType: { select: { id: true, name: true, slug: true } },
      fileUpload: { select: { id: true, url: true, filename: true, originalName: true } },
    },
  })

  // If rejected, create notification for the applicant
  if (parsed.data.status === 'REJECTED') {
    await prismaUnfiltered.notification.create({
      data: {
        userId: doc.application.userId,
        title: 'Document Rejected',
        message: `Your "${updated.documentType.name}" document was rejected. ${parsed.data.rejectionReason ? `Reason: ${parsed.data.rejectionReason}` : 'Please re-upload.'}`,
        type: 'WARNING',
        linkUrl: '/applicant/application/documents',
        linkText: 'Re-upload Document',
      },
    }).catch(console.error)
  }

  return apiSuccess(updated)
})
