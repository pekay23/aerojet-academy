import 'server-only'

import crypto from 'crypto'
import { Prisma } from '@prisma/client'
import { prismaUnfiltered } from '@/lib/prisma/client'
import QRCode from 'qrcode'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'

/**
 * Document verification record library.
 *
 * Every generated certificate / transcript creates a `DocumentVerification`
 * row keyed by a short, public-safe code. The QR code rendered on the PDF
 * points at `/verify/{code}` which reads this table anonymously.
 */

// ── Code generation ─────────────────────────────────────────────────────────

/**
 * Generate a unique, collision-free verification code.
 * Format: "AJ-{YYYY}-{RANDOM6}" where RANDOM6 is uppercase alphanumeric.
 * Example: "AJ-2026-A7X9K2"
 *
 * Uses an unambiguous alphabet (no 0/O, 1/I/L) so codes stay legible on small
 * printed QR captions and in hand-written transcription.
 */
export function generateVerificationCode(): string {
  const year = new Date().getFullYear()
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.randomBytes(6)
  let random = ''
  for (let i = 0; i < 6; i++) {
    random += chars[bytes[i] % chars.length]
  }
  return `AJ-${year}-${random}`
}

// ── Verification record API ──────────────────────────────────────────────────

export interface CreateVerificationParams {
  templateId?: string | null
  recipientName: string
  documentType: string
  certificateNo?: string | null
  issueDate: Date
  metadata?: Record<string, unknown>
  generatedBy?: string | null
}

/**
 * Create a new verification record. Retries up to 10 times if a generated
 * code already exists (P2002 collisions are vanishingly unlikely with a
 * 32^6 alphanumeric space, but we belt-and-brace it).
 *
 * Idempotency: if `certificateNo` is provided and a matching record already
 * exists, the existing record is returned instead of creating a duplicate.
 */
export async function createVerificationRecord(
  params: CreateVerificationParams
): Promise<{ id: string; code: string }> {
  // Idempotency guard: reuse existing record when certificateNo is provided
  if (params.certificateNo) {
    const existing = await prismaUnfiltered.documentVerification.findFirst({
      where: { certificateNo: params.certificateNo },
      select: { id: true, code: true },
    })
    if (existing) return existing
  }

  let code = generateVerificationCode()
  for (let attempt = 0; attempt < 10; attempt++) {
    const existing = await prismaUnfiltered.documentVerification.findUnique({
      where: { code },
      select: { id: true },
    })
    if (!existing) break
    code = generateVerificationCode()
  }

  const created = await prismaUnfiltered.documentVerification.create({
    data: {
      code,
      templateId: params.templateId ?? undefined,
      recipientName: params.recipientName,
      documentType: params.documentType,
      certificateNo: params.certificateNo ?? undefined,
      issueDate: params.issueDate,
      metadata: (params.metadata ?? undefined) as Prisma.JsonValue,
      generatedBy: params.generatedBy ?? undefined,
    } as Prisma.DocumentVerificationCreateInput,
    select: { id: true, code: true },
  })

  await createAuditLog({
    userId: params.generatedBy ?? 'system',
    action: AuditAction.CREATE,
    entity: 'DocumentVerification',
    entityId: created.id,
    description: `Created verification record ${created.code} for ${params.documentType}`,
    changes: { code: created.code, documentType: params.documentType, certificateNo: params.certificateNo, recipientName: params.recipientName },
  })

  return created
}

/**
 * Public lookup — returns the record if the code exists and is valid, null otherwise.
 * Checks revocation and expiry before returning.
 * Intended for the anonymous `/verify/[code]` page.
 *
 * Also supports lookup by `certificateNo` when the caller only has the certificate
 * number (e.g. QR codes embedded in PDFs that point to `/verify/{certificateId}`).
 */
export async function verifyDocument(code?: string, certificateNo?: string): Promise<{
  id: string
  code: string
  certificateNo?: string | null
  recipientName: string
  documentType: string
  issueDate: Date
  revokedAt?: Date | null
  expiresAt?: Date | null
} | null> {
  let record = null as {
    id: string
    code: string
    certificateNo?: string | null
    recipientName: string
    documentType: string
    issueDate: Date
    revokedAt?: Date | null
    expiresAt?: Date | null
  } | null

  if (code) {
    record = await prismaUnfiltered.documentVerification.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        certificateNo: true,
        recipientName: true,
        documentType: true,
        issueDate: true,
        revokedAt: true,
        expiresAt: true,
      },
    })
  }

  if (!record && certificateNo) {
    record = await prismaUnfiltered.documentVerification.findFirst({
      where: { certificateNo },
      select: {
        id: true,
        code: true,
        certificateNo: true,
        recipientName: true,
        documentType: true,
        issueDate: true,
        revokedAt: true,
        expiresAt: true,
      },
    })
  }

  if (!record) return null
  if (record.revokedAt) return null
  if (record.expiresAt && record.expiresAt < new Date()) return null
  return record
}

/**
 * Get the public verification URL for a given code.
 */
export function getVerificationUrl(code: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  return `${base}/verify/${code}`
}

/**
 * Generate a QR code data URL for a verification code.
 */
export async function generateVerificationQrDataUrl(code: string): Promise<string> {
  const url = getVerificationUrl(code)
  return QRCode.toDataURL(url, { width: 120, margin: 1 })
}