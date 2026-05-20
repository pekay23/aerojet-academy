import 'server-only'
import { prismaUnfiltered } from '@/lib/prisma/client'
import {
  type StorageScope,
  buildStoragePath,
} from './supabase-storage'

/**
 * Maps each UploadThing route slug to a Supabase storage scope and category.
 * Used by `recordFileUpload()` so every UT upload lands in a predictable
 * Supabase folder once the mirror cron runs.
 *
 * Note: UploadThing route slugs are declared in `app/api/uploadthing/core.ts`.
 * Keep these in sync if you add a route.
 */
export const ROUTE_STORAGE_MAP: Record<
  string,
  { scope: StorageScope; category?: string }
> = {
  paymentProof: { scope: 'payments', category: 'proofs' },
  profileImage: { scope: 'profile-photos' },
  newsCoverImage: { scope: 'news', category: 'cover' },
  newsAttachment: { scope: 'news', category: 'attachment' },
  newsImage: { scope: 'news', category: 'image' },
  newsAudio: { scope: 'news', category: 'audio' },
  applicantDocument: { scope: 'applicants' },
  resourceFile: { scope: 'resources' },
}

export interface RecordFileUploadArgs {
  userId: string
  route: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  uploadthingUrl: string
  uploadthingKey: string
  referenceType?: string
  referenceId?: string
}

/**
 * Inserts a FileUpload row right after UploadThing finishes. The
 * `supabasePath` is computed deterministically but `mirroredAt` stays null —
 * the nightly cron at `/api/cron/supabase-mirror` will fetch the bytes from
 * UploadThing and upload them to Supabase, then set `mirroredAt`.
 *
 * Failures are swallowed (best-effort): we don't want an audit/record write
 * to break the user-facing upload flow. The row can be backfilled by hand
 * from the UploadThing dashboard if needed.
 */
export async function recordFileUpload(args: RecordFileUploadArgs) {
  try {
    const mapping = ROUTE_STORAGE_MAP[args.route]
    const supabasePath = mapping
      ? buildStoragePath({
          scope: mapping.scope,
          ownerId: args.userId,
          category: mapping.category,
          fileName: args.originalName,
        })
      : null

    return await prismaUnfiltered.fileUpload.create({
      data: {
        userId: args.userId,
        filename: args.filename,
        originalName: args.originalName,
        mimeType: args.mimeType,
        size: args.size,
        url: args.uploadthingUrl,
        fileType: args.mimeType.split('/')[0] || 'unknown',
        route: args.route,
        uploadthingUrl: args.uploadthingUrl,
        uploadthingKey: args.uploadthingKey,
        supabasePath,
        referenceType: args.referenceType,
        referenceId: args.referenceId,
      },
    })
  } catch (err) {
    console.error('[file-upload-record] insert failed:', err)
    return null
  }
}
