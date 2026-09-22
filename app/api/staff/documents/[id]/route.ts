import { NextRequest } from 'next/server'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireStaff } from '@/lib/auth/helpers'
import { apiError, apiNotFound, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { getSignedUrl } from '@/lib/storage/supabase-storage'

/**
 * Auth-gated document proxy.
 *
 * StudentDocument.fileUrl now stores the storage PATH (not a long-lived
 * signed URL), so every view must resolve a fresh short-lived signed URL
 * behind this endpoint. This keeps bucket objects private even if the
 * database column is ever exposed.
 *
 * Accepts either:
 *   GET /api/staff/documents/[id]          — resolve by document id
 *   GET /api/staff/documents/proxy?path=…  — resolve by raw storage path
 */
export const GET = withErrorHandler(
  async (req: NextRequest, ctx: { params: Promise<{ id?: string }> }) => {
    await requireStaff()
    const { searchParams } = new URL(req.url)
    const path = searchParams.get('path')
    const params = await ctx.params
    const id = params?.id

    let fileUrl: string | null = null
    let title: string | null = null

    if (id) {
      const doc = await prismaUnfiltered.studentDocument.findUnique({
        where: { id },
        select: { id: true, fileUrl: true, storageProvider: true, title: true },
      })
      if (!doc) return apiNotFound('Document not found.')
      if (doc.storageProvider !== 'SUPABASE' || !doc.fileUrl) {
        return apiError('This document is not backed by Supabase storage.', 404)
      }
      fileUrl = doc.fileUrl
      title = doc.title
    } else if (path) {
      fileUrl = path
    } else {
      return apiError('Provide either an [id] path segment or ?path=….', 400)
    }

    const signedUrl = await getSignedUrl(fileUrl, 60 * 15) // 15 minutes
    if (!signedUrl) return apiError('Could not resolve a signed URL for this document.', 502)

    return apiSuccess({ url: signedUrl, title: title ?? undefined })
  }
)
