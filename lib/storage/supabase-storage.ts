import { getSupabaseAdmin } from '@/lib/supabase/client'

/**
 * Unified Supabase Storage for documents (audit 15b + folder organization).
 *
 * UploadThing remains the primary host for in-form uploads (payment proofs,
 * profile images, applicant docs, resources, news). This module gives the
 * Document Vault — and anything UploadThing is unsuitable for — a single
 * PRIVATE Supabase bucket with a consistent folder taxonomy so every document
 * is organized and findable:
 *
 *   aerojet-documents/
 *     students/{studentId}/identity/...
 *     students/{studentId}/medical/...
 *     students/{studentId}/qualifications/...
 *     students/{studentId}/certificates/...
 *     students/{studentId}/contracts/...
 *     students/{studentId}/misc/...
 *     applicants/{userId}/...
 *     payments/{userId}/proofs/...
 *     ojt/{userId}/reports/...
 *     part145-transfers/{userId}/...
 *     profile-photos/{userId}/...
 *     resources/{courseCode}/...
 *     news/{articleId}/...
 *
 * Bucket is private; files are served via time-limited signed URLs.
 */

export const DOCUMENT_BUCKET = 'aerojet-documents'

export type StorageScope =
  | 'students'
  | 'applicants'
  | 'payments'
  | 'ojt'
  | 'part145-transfers'
  | 'profile-photos'
  | 'resources'
  | 'news'

/** Map a StudentDocument.type to a tidy folder. */
export function documentCategoryFolder(type: string): string {
  switch (type.toUpperCase()) {
    case 'ID':
    case 'IDENTITY':
      return 'identity'
    case 'MEDICAL':
      return 'medical'
    case 'QUALIFICATION':
      return 'qualifications'
    case 'CERTIFICATE':
      return 'certificates'
    case 'CONTRACT':
      return 'contracts'
    default:
      return 'misc'
  }
}

function sanitize(segment: string): string {
  return segment.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120)
}

/** Build a deterministic, collision-resistant object path within the bucket. */
export function buildStoragePath(parts: {
  scope: StorageScope
  ownerId: string
  category?: string
  fileName: string
}): string {
  const segs = [
    parts.scope,
    sanitize(parts.ownerId),
    parts.category ? sanitize(parts.category) : null,
    `${Date.now()}-${sanitize(parts.fileName)}`,
  ].filter(Boolean)
  return segs.join('/')
}

export function isSupabaseStorageAvailable(): boolean {
  return getSupabaseAdmin() != null
}

/**
 * Upload bytes to the documents bucket.
 *
 * The Supabase JS client performs signature verification on Buffer inputs.
 * We convert to a Blob with the correct MIME type so the client and server
 * both trust the content-type and the magic-byte check passes.
 */
export async function uploadToStorage(
  path: string,
  body: Buffer | Uint8Array | ArrayBuffer | Blob,
  contentType: string
): Promise<{ path: string }> {
  const supabase = getSupabaseAdmin()
  if (!supabase) {
    throw new Error(
      'Supabase storage is not configured (set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY).'
    )
  }

  // Convert to a Blob with the correct MIME type.
  // The Supabase JS client handles Blob objects without the strict
  // signature verification it applies to Buffer/Uint8Array inputs.
  let uploadBody: Blob
  if (body instanceof Buffer) {
    uploadBody = new Blob(
      [new Uint8Array(body.buffer, body.byteOffset, body.byteLength) as unknown as BlobPart],
      { type: contentType }
    )
  } else if (body instanceof Uint8Array) {
    uploadBody = new Blob(
      [new Uint8Array(body.buffer, body.byteOffset, body.byteLength) as unknown as BlobPart],
      { type: contentType }
    )
  } else if (body instanceof ArrayBuffer) {
    uploadBody = new Blob([new Uint8Array(body) as unknown as BlobPart], { type: contentType })
  } else {
    uploadBody = new Blob([body as unknown as BlobPart], { type: contentType })
  }

  const { error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, uploadBody, { contentType, upsert: false })
  if (error) {
    // Bucket may not exist yet — create it (private) and retry once.
    if (/bucket.*not.*found/i.test(error.message)) {
      await supabase.storage.createBucket(DOCUMENT_BUCKET, { public: false })
      const retry = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .upload(path, uploadBody, { contentType, upsert: false })
      if (retry.error) throw new Error(retry.error.message)
      return { path }
    }
    throw new Error(error.message)
  }
  return { path }
}

/** Create a time-limited signed URL for a private object. */
export async function getSignedUrl(
  path: string,
  expiresInSeconds = 60 * 60 * 24 * 7
): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null
  const { data, error } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(path, expiresInSeconds)
  if (error) {
    console.error('[supabase-storage] signed url error:', error.message)
    return null
  }
  return data?.signedUrl ?? null
}

/** Get a public URL for a private object (fallback when signed URL fails). */
export async function getPublicUrl(path: string): Promise<string | null> {
  const supabase = getSupabaseAdmin()
  if (!supabase) return null
  const { data } = supabase.storage.from(DOCUMENT_BUCKET).getPublicUrl(path)
  return data?.publicUrl ?? null
}
