/**
 * Shared types for the Document Vault. Kept in a leaf module so both the
 * server actions and the client components import from one source of truth.
 */

export const DOCUMENT_TYPES = [
  'ID',
  'MEDICAL',
  'QUALIFICATION',
  'CERTIFICATE',
  'CONTRACT',
  'OTHER',
] as const
export type DocumentType = (typeof DOCUMENT_TYPES)[number]

export interface StudentOption {
  id: string
  email: string
  name: string
  studentId: string | null
}

export interface StudentDocument {
  id: string
  type: string
  title: string
  fileUrl: string
  storageProvider: string
  version: number
  status: string
  createdAt: string
  expiresAt: string | null
  user: {
    email: string
    profile: { firstName: string; lastName: string } | null
    studentProfile: { studentId: string } | null
  }
}

/** Max upload size per file and per request, in bytes. */
export const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50 MiB
export const MAX_TOTAL_BYTES = 200 * 1024 * 1024 // 200 MiB

/** Allowed MIME types for direct document uploads. */
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff',
] as const

/** Allowed file extensions (lowercase, without leading dot). */
export const ALLOWED_EXTENSIONS = [
  'pdf',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'bmp',
  'tiff',
] as const

/** Magic-byte signatures used to verify the uploaded content matches its declared type. */
export const MAGIC_SIGNATURES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/png': [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]], // PNG
  'image/jpeg': [[0xff, 0xd8, 0xff]], // JPEG
  'image/gif': [[0x47, 0x49, 0x46, 0x38]], // GIF
  'image/bmp': [[0x42, 0x4d]], // BM
}

/**
 * Validate that a file passes MIME + extension + magic-byte checks.
 * Returns an error message, or null when the file is acceptable.
 */
export function validateDocumentFile(file: File): string | null {
  if (file.size === 0) return 'File is empty.'
  if (file.size > MAX_FILE_SIZE) {
    return `File exceeds the ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MiB limit.`
  }
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ext || !(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return `File type ".${ext}" is not allowed. Allowed: ${(ALLOWED_EXTENSIONS as readonly string[]).join(', ')}.`
  }
  const mime = file.type?.toLowerCase() ?? ''
  const allowedMimes = ALLOWED_MIME_TYPES as readonly string[]
  if (mime && !allowedMimes.includes(mime as (typeof ALLOWED_MIME_TYPES)[number])) {
    return `MIME type "${mime}" is not allowed. Allowed: ${(allowedMimes as readonly string[]).join(', ')}.`
  }
  return null
}

/**
 * Best-effort magic-byte check. Runs on the first bytes of the uploaded file.
 * Returns an error message, or null when the signature matches.
 */
export function validateMagicBytes(bytes: Uint8Array, declaredMime: string): string | null {
  const signatures = MAGIC_SIGNATURES[declaredMime]
  if (!signatures) return null // Unknown MIME — rely on extension check.
  for (const sig of signatures) {
    if (bytes.length < sig.length) continue
    if (sig.every((b, i) => bytes[i] === b)) return null
  }
  return `File content does not match the declared type "${declaredMime}".`
}

/**
 * Validate a hosted file URL is an absolute http(s) URL.
 * @deprecated Use `safeDocumentUrl` from `@/lib/utils/sanitize` instead.
 * This function does NOT validate against trusted document hosts.
 */
export function validateFileUrl(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return 'File URL is not a valid URL.'
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return 'File URL must start with http:// or https://.'
  }
  if (!parsed.hostname) return 'File URL is missing a host.'
  return null
}

// ---------------------------------------------------------------------------
// Shared client-component row shapes
//
// These mirror the Prisma selects used by the Document Vault and the
// Expiring Documents view. Keeping them here (rather than inline in each
// client component) prevents the two representations from drifting.
// ---------------------------------------------------------------------------

/** Whole days between `now` and the ISO date string. Negative = past due. */
export interface ExpiryRow {
  expiresAt: string | null
  daysUntil: number | null
}

/** Student-document row as consumed by client components. */
export interface DocumentRow extends StudentDocument, ExpiryRow {}

/** License-category summary as consumed by client components. */
export interface LicenseCategoryShape {
  code: string
  name: string
}

/** License-target row as consumed by client components. */
export interface LicenseRow {
  id: string
  validFrom: string | null
  expiresAt: string | null
  daysUntil: number | null
  ratingClass: string | null
  validityPeriodMonths: number | null
  licenseCategory: LicenseCategoryShape | null
  studentProfile: {
    studentId: string
    user: {
      email: string
      profile: { firstName: string; lastName: string } | null
    }
  }
}
