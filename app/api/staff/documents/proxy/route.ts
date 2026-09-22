import { NextRequest } from 'next/server'
import { requireStaff } from '@/lib/auth/helpers'
import { apiError, apiSuccess, withErrorHandler } from '@/lib/api/response'
import { getSignedUrl } from '@/lib/storage/supabase-storage'

/**
 * Auth-gated document proxy — resolves a raw storage path to a fresh
 * short-lived signed URL. Used by the client "Open" button for
 * Supabase-backed documents whose `fileUrl` is a storage path, not a URL.
 *
 * GET /api/staff/documents/proxy?path=students/<id>/identity/1-file.pdf
 */
export const GET = withErrorHandler(async (req: NextRequest) => {
  await requireStaff()
  const { searchParams } = new URL(req.url)
  const path = searchParams.get('path')

  if (!path) return apiError('Missing required "path" query parameter.', 400)

  const signedUrl = await getSignedUrl(path, 60 * 15) // 15 minutes
  if (!signedUrl) return apiError('Could not resolve a signed URL for this document.', 502)

  return apiSuccess({ url: signedUrl })
})