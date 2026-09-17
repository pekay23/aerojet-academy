'use server'

import crypto from 'crypto'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { requireAdmin, getAuthSession } from '@/lib/auth/helpers'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { uploadToStorage, getSignedUrl } from '@/lib/storage/supabase-storage'
import { updateTag } from 'next/cache'
import { Prisma } from '@prisma/client'
import { isPdfTemplateSystemEnabled } from '@/lib/settings'

const MAX_SIGNATURE_SIZE = 500 * 1024 // 500KB
const MAX_REVOKE_REASON_LENGTH = 500
const MAX_LIST_LIMIT = 200

const VALID_SIGNATURE_TYPES = ['image/png', 'image/jpeg']

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47])
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff])

async function ensurePdfTemplateEnabled() {
  const enabled = await isPdfTemplateSystemEnabled()
  if (!enabled) {
    throw new Error('PDF template system is currently disabled')
  }
}

// ── Template Actions ────────────────────────────────────────────────────────

export async function saveTemplateAction(data: {
  id?: string
  name: string
  slug: string
  type: 'CERTIFICATE' | 'TRANSCRIPT'
  content: Record<string, unknown>
  branding?: Record<string, unknown> | null
  numberFormat?: string | null
  layout?: string
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
}) {
  await requireAdmin()
  await ensurePdfTemplateEnabled()
  const session = await getAuthSession()
  const userId = session?.user?.id

  if (data.id) {
    const existing = await prismaUnfiltered.pdfTemplate.findUnique({ where: { id: data.id } })
    if (!existing) throw new Error('Template not found')
    const updated = await prismaUnfiltered.pdfTemplate.update({
      where: { id: data.id },
      data: {
        name: data.name,
        slug: data.slug,
        type: data.type,
        content: data.content as Prisma.InputJsonValue,
        branding: (data.branding ?? undefined) as Prisma.InputJsonValue,
        numberFormat: data.numberFormat ?? null,
        layout: data.layout ?? 'default',
        status: data.status ?? existing.status,
        updatedBy: userId,
      },
    })
    await createAuditLog({
      userId,
      action: AuditAction.UPDATE,
      entity: 'PdfTemplate',
      entityId: updated.id,
      description: `Updated template: ${updated.name}`,
      changes: { name: data.name, slug: data.slug },
    })
    updateTag(`pdf-template:${updated.type}`)
    updateTag(`pdf-template:id:${updated.id}`)
    return { id: updated.id }
  } else {
    const created = await prismaUnfiltered.pdfTemplate.create({
      data: {
        name: data.name,
        slug: data.slug,
        type: data.type,
        content: data.content as Prisma.InputJsonValue,
        branding: (data.branding ?? null) as Prisma.InputJsonValue,
        numberFormat: data.numberFormat ?? null,
        layout: data.layout ?? 'default',
        status: data.status ?? 'DRAFT',
        createdBy: userId,
        updatedBy: userId,
      },
    })
    await createAuditLog({
      userId,
      action: AuditAction.CREATE,
      entity: 'PdfTemplate',
      entityId: created.id,
      description: `Created template: ${created.name}`,
      changes: { name: data.name, slug: data.slug },
    })
updateTag(`pdf-template:${created.type}`)
    updateTag(`pdf-template:id:${created.id}`)
    return { id: created.id }
  }
}

export async function setDefaultTemplateAction(id: string) {
  await requireAdmin()
  await ensurePdfTemplateEnabled()
  const session = await getAuthSession()
  const template = await prismaUnfiltered.pdfTemplate.findUnique({ where: { id } })
  if (!template) throw new Error('Template not found')

  await prismaUnfiltered.$transaction([
    prismaUnfiltered.pdfTemplate.updateMany({
      where: { type: template.type, isDefault: true },
      data: { isDefault: false },
    }),
    prismaUnfiltered.pdfTemplate.update({
      where: { id },
      data: { isDefault: true, status: 'ACTIVE' },
    }),
  ])

  await createAuditLog({
    userId: session?.user?.id,
    action: AuditAction.UPDATE,
    entity: 'PdfTemplate',
    entityId: id,
    description: `Set template ${template.name} as default for ${template.type}`,
    changes: { isDefault: true, type: template.type },
  })

  updateTag(`pdf-template:${template.type}`)
  updateTag(`pdf-template:id:${id}`)
}

export async function cloneTemplateAction(id: string, newName: string) {
  await requireAdmin()
  await ensurePdfTemplateEnabled()
  const session = await getAuthSession()
  const source = await prismaUnfiltered.pdfTemplate.findUnique({ where: { id } })
  if (!source) throw new Error('Template not found')

  const slug = newName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const created = await prismaUnfiltered.pdfTemplate.create({
    data: {
      name: newName,
      slug,
      type: source.type,
      layout: source.layout,
      status: 'DRAFT',
      isDefault: false,
      content: source.content as Prisma.JsonValue,
      branding: (source.branding ?? undefined) as Prisma.JsonValue,
      numberFormat: source.numberFormat,
      lastSequence: 0,
      lastSequenceYear: new Date().getFullYear(),
      clonedFromId: source.id,
    } as Prisma.PdfTemplateCreateInput,
  })

  await createAuditLog({
    userId: session?.user?.id,
    action: AuditAction.CREATE,
    entity: 'PdfTemplate',
    entityId: created.id,
    description: `Cloned template ${source.name} as ${newName}`,
    changes: { sourceId: source.id, newName },
  })

  updateTag(`pdf-template:${created.type}`)
  updateTag(`pdf-template:id:${created.id}`)

  return { id: created.id }
}

export async function archiveTemplateAction(id: string) {
  await requireAdmin()
  await ensurePdfTemplateEnabled()
  const session = await getAuthSession()
  const template = await prismaUnfiltered.pdfTemplate.findUnique({ where: { id } })
  if (!template) throw new Error('Template not found')

  await prismaUnfiltered.pdfTemplate.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  })

  await createAuditLog({
    userId: session?.user?.id,
    action: AuditAction.UPDATE,
    entity: 'PdfTemplate',
    entityId: id,
    description: `Archived template: ${template.name}`,
    changes: { status: 'ARCHIVED' },
  })

  updateTag(`pdf-template:${template.type}`)
  updateTag(`pdf-template:id:${id}`)
}

export async function activateTemplateAction(id: string) {
  await requireAdmin()
  await ensurePdfTemplateEnabled()
  const session = await getAuthSession()
  const template = await prismaUnfiltered.pdfTemplate.findUnique({ where: { id } })
  if (!template) throw new Error('Template not found')

  await prismaUnfiltered.pdfTemplate.update({
    where: { id },
    data: { status: 'ACTIVE' },
  })

  await createAuditLog({
    userId: session?.user?.id,
    action: AuditAction.UPDATE,
    entity: 'PdfTemplate',
    entityId: id,
    description: `Activated template: ${template.name}`,
    changes: { status: 'ACTIVE' },
  })

  updateTag(`pdf-template:${template.type}`)
  updateTag(`pdf-template:id:${id}`)
}

// ── Signature Actions ────────────────────────────────────────────────────────

export async function uploadSignatureAction(
  data: {
    label: string
    signerName: string
    expiresAt?: Date | null
    file: string // base64-encoded
    contentType: string
    consentGivenBy?: string
    consentMethod?: 'in_person' | 'email' | 'verbal' | 'written'
  },
  consentOverrides?: {
    consentGivenBy?: string
    consentMethod?: 'in_person' | 'email' | 'verbal' | 'written'
  }
) {
  await requireAdmin()
  await ensurePdfTemplateEnabled()
  const session = await getAuthSession()
  const uploaderId = session?.user?.id

  if (!VALID_SIGNATURE_TYPES.includes(data.contentType)) {
    throw new Error('Invalid signature type. Only PNG and JPG are supported.')
  }

  const buffer = Buffer.from(data.file, 'base64')
  if (buffer.length > MAX_SIGNATURE_SIZE) {
    throw new Error('Signature file exceeds 500KB limit.')
  }

  if (!buffer.slice(0, PNG_MAGIC.length).equals(PNG_MAGIC) && !buffer.slice(0, JPEG_MAGIC.length).equals(JPEG_MAGIC)) {
    throw new Error('Invalid signature file. File magic bytes do not match PNG or JPEG.')
  }

  const consentGivenBy = consentOverrides?.consentGivenBy ?? data.consentGivenBy ?? uploaderId
  const consentMethod = consentOverrides?.consentMethod ?? data.consentMethod ?? 'in_person'

  const ext = data.contentType === 'image/png' ? 'png' : 'jpg'
  const path = `signatures/${crypto.randomUUID()}.${ext}`
  await uploadToStorage(path, buffer, data.contentType)

  const signature = await prismaUnfiltered.pdfSignature.create({
    data: {
      label: data.label,
      signerName: data.signerName,
      imageUrl: path,
      expiresAt: data.expiresAt ?? null,
      uploadedBy: uploaderId,
      consentGivenBy,
      consentMethod,
    },
  })

  await createAuditLog({
    userId: uploaderId,
    action: AuditAction.CREATE,
    entity: 'PdfSignature',
    entityId: signature.id,
    description: `Uploaded signature: ${signature.label} (${signature.signerName})`,
    changes: { label: signature.label, signerName: signature.signerName, consentGivenBy, consentMethod },
  })

  updateTag('pdf-template')

  return { id: signature.id }
}

export async function deleteSignatureAction(id: string) {
  await requireAdmin()
  await ensurePdfTemplateEnabled()
  const session = await getAuthSession()
  const existing = await prismaUnfiltered.pdfSignature.findUnique({ where: { id } })
  if (!existing) throw new Error('Signature not found')

  const assigned = await prismaUnfiltered.pdfTemplateSignature.findFirst({
    where: { signatureId: id },
  })
  if (assigned) {
    throw new Error('Cannot delete signature assigned to a template.')
  }
  await prismaUnfiltered.pdfSignature.delete({ where: { id } })

  await createAuditLog({
    userId: session?.user?.id,
    action: AuditAction.DELETE,
    entity: 'PdfSignature',
    entityId: id,
    description: `Deleted signature: ${existing.label} (${existing.signerName})`,
    changes: { label: existing.label, signerName: existing.signerName },
  })

  updateTag('pdf-template')
}

export async function assignSignatureAction(
  templateId: string,
  signatureId: string,
  position: number
) {
  const session = await getAuthSession()
  const userId = session?.user?.id
  await requireAdmin()
  await ensurePdfTemplateEnabled()
  if (position !== 0 && position !== 1) {
    throw new Error('Position must be 0 (left) or 1 (right).')
  }

  await prismaUnfiltered.pdfTemplateSignature.upsert({
    where: { templateId_position: { templateId, position } },
    update: { signatureId },
    create: { templateId, signatureId, position },
  })

  await createAuditLog({
    userId,
    action: AuditAction.UPDATE,
    entity: 'PdfTemplateSignature',
    description: `Assigned signature ${signatureId} to template ${templateId} at position ${position}`,
    changes: { templateId, signatureId, position },
  })

  updateTag('pdf-template')
}

export async function removeSignatureAssignmentAction(
  templateId: string,
  position: number
) {
  const session = await getAuthSession()
  const userId = session?.user?.id
  await requireAdmin()
  await ensurePdfTemplateEnabled()
  await prismaUnfiltered.pdfTemplateSignature.deleteMany({
    where: { templateId, position },
  })

  await createAuditLog({
    userId,
    action: AuditAction.DELETE,
    entity: 'PdfTemplateSignature',
    description: `Removed signature assignment from template ${templateId} at position ${position}`,
    changes: { templateId, position },
  })

  updateTag('pdf-template')
}

// ── List Actions ────────────────────────────────────────────────────────────

export async function listTemplatesForAdmin() {
  await requireAdmin()
  await ensurePdfTemplateEnabled()
  return prismaUnfiltered.pdfTemplate.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      signatures: { include: { signature: true } },
      _count: { select: { verifications: true } },
    },
  })
}

export async function listSignaturesForAdmin() {
  await requireAdmin()
  await ensurePdfTemplateEnabled()
  const signatures = await prismaUnfiltered.pdfSignature.findMany({
    orderBy: { sortOrder: 'asc' },
    include: {
      templates: { include: { template: true } },
    },
  })

  const withSignedUrls = await Promise.all(
    signatures.map(async (sig) => {
      const signedUrl = await getSignedUrl(sig.imageUrl)
      return { ...sig, signedUrl: signedUrl || '' }
    }),
  )

  return withSignedUrls
}

// ── Update Actions ───────────────────────────────────────────────────────────

export async function renameTemplateAction(id: string, newName: string) {
  await requireAdmin()
  await ensurePdfTemplateEnabled()
  const session = await getAuthSession()
  const existing = await prismaUnfiltered.pdfTemplate.findUnique({ where: { id } })
  if (!existing) throw new Error('Template not found')

  const slug = newName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const updated = await prismaUnfiltered.pdfTemplate.update({
    where: { id },
    data: { name: newName, slug },
  })

  await createAuditLog({
    userId: session?.user?.id,
    action: AuditAction.UPDATE,
    entity: 'PdfTemplate',
    entityId: id,
    description: `Renamed template to: ${newName}`,
    changes: { name: newName, slug },
  })

  updateTag(`pdf-template:${updated.type}`)
  updateTag(`pdf-template:id:${id}`)
  return { id: updated.id }
}

export async function updateSignatureAction(
  id: string,
  data: {
    label?: string
    signerName?: string
    expiresAt?: string | null
  }
) {
  await requireAdmin()
  await ensurePdfTemplateEnabled()
  const session = await getAuthSession()
  const existing = await prismaUnfiltered.pdfSignature.findUnique({ where: { id } })
  if (!existing) throw new Error('Signature not found')

  const updateData: Record<string, unknown> = {}
  if (data.label !== undefined) updateData.label = data.label
  if (data.signerName !== undefined) updateData.signerName = data.signerName
  if (data.expiresAt !== undefined) {
    updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null
  }

  const updated = await prismaUnfiltered.pdfSignature.update({
    where: { id },
    data: updateData,
  })

  await createAuditLog({
    userId: session?.user?.id,
    action: AuditAction.UPDATE,
    entity: 'PdfSignature',
    entityId: id,
    description: `Updated signature: ${updated.label}`,
    changes: { label: updated.label, signerName: updated.signerName },
  })

  updateTag('pdf-template')

  return { id: updated.id }
}

// ── Verification Actions ─────────────────────────────────────────────────────

export async function revokeVerificationAction(code: string, reason: string) {
  await requireAdmin()
  await ensurePdfTemplateEnabled()
  const session = await getAuthSession()
  const actorId = session?.user?.id

  if (!reason?.trim()) {
    throw new Error('Revocation reason is required')
  }
  const trimmedReason = reason.trim()
  if (trimmedReason.length > MAX_REVOKE_REASON_LENGTH) {
    throw new Error(`Revocation reason must be ${MAX_REVOKE_REASON_LENGTH} characters or fewer`)
  }

  const existing = await prismaUnfiltered.documentVerification.findUnique({
    where: { code },
    select: { id: true, code: true, revokedAt: true },
  })
  if (!existing) throw new Error('Verification record not found')
  if (existing.revokedAt) throw new Error('This verification record is already revoked')

  const updated = await prismaUnfiltered.documentVerification.update({
    where: { code },
    data: {
      revokedAt: new Date(),
      revokedBy: actorId,
      revokeReason: trimmedReason,
    },
    select: { id: true, code: true, revokedAt: true },
  })

  await createAuditLog({
    userId: actorId,
    action: AuditAction.UPDATE,
    entity: 'DocumentVerification',
    entityId: updated.id,
    description: `Revoked verification record ${updated.code}`,
    changes: { code: updated.code, revokedAt: updated.revokedAt, reason: trimmedReason },
  })

  updateTag('pdf-template')
  updateTag('pdf-template:verifications')

  return { id: updated.id, code: updated.code }
}

export async function listVerificationsForAdmin(options?: { limit?: number; offset?: number }) {
  await requireAdmin()
  await ensurePdfTemplateEnabled()
  const limit = Math.min(options?.limit ?? 50, MAX_LIST_LIMIT)
  const offset = options?.offset ?? 0

  const [verifications, total] = await Promise.all([
    prismaUnfiltered.documentVerification.findMany({
      orderBy: { issueDate: 'desc' },
      take: limit,
      skip: offset,
      select: {
        id: true,
        code: true,
        documentType: true,
        certificateNo: true,
        recipientName: true,
        issueDate: true,
        revokedAt: true,
        expiresAt: true,
        revokedBy: true,
        revokeReason: true,
        generatedBy: true,
        createdAt: true,
      },
    }),
    prismaUnfiltered.documentVerification.count(),
  ])

  return { verifications, total, limit, offset }
}
