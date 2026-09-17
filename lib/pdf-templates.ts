import 'server-only'

import { unstable_cache } from 'next/cache'
import { Prisma } from '@prisma/client'

import { prismaUnfiltered } from '@/lib/prisma/client'
import { getSignedUrl } from '@/lib/storage/supabase-storage'
import { DEFAULT_PDF_TEXT } from '@/lib/constants/business-rules'

/**
 * PDF template management library.
 *
 * Templates are admin-authored records that drive the layout, text content,
 * signatures, branding, and certificate numbering for generated PDFs.
 *
 * Reads use `unstable_cache` (5-min TTL) since templates change rarely and are
 * consulted on every PDF render. Mutations invalidate the cache implicitly by
 * creating new rows — call `revalidateTag` from the relevant server action if
 * you need to push the change through faster.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface CertificateContent {
  title?: string
  subtitle?: string
  completionText?: string
  accreditationText?: string
  signatureLabels?: string[]
}

export interface TranscriptContent {
  sectionHeaders?: {
    studentInfo?: string
    academicRecord?: string
  }
  disclaimerText?: string
  signatureLabels?: string[]
}

export interface TemplateBranding {
  logoUrl?: string
  watermarkUrl?: string
  watermarkOpacity?: number
  footerText?: string
}

export interface ResolvedSignature {
  label: string
  signerName: string
  imageDataUri: string
  position: number
  expiresAt: Date | null
}

// ── Default fallback content (hardcoded values) ─────────────────────────────
// Used when no template is configured — mirrors CertificateTemplate.tsx defaults.

export const DEFAULT_CERTIFICATE_CONTENT: CertificateContent = {
  title: DEFAULT_PDF_TEXT.CERTIFICATE_TITLE,
  subtitle: DEFAULT_PDF_TEXT.CERTIFICATE_SUBTITLE,
  completionText: DEFAULT_PDF_TEXT.CERTIFICATE_COMPLETION_TEXT,
  accreditationText: DEFAULT_PDF_TEXT.CERTIFICATE_ACCREDITATION_TEXT,
  signatureLabels: [...DEFAULT_PDF_TEXT.CERTIFICATE_SIGNATURE_LABELS],
}

export const DEFAULT_TRANSCRIPT_CONTENT: TranscriptContent = {
  sectionHeaders: DEFAULT_PDF_TEXT.TRANSCRIPT_SECTION_HEADERS,
  disclaimerText: DEFAULT_PDF_TEXT.TRANSCRIPTDisclaimerText,
  signatureLabels: [...DEFAULT_PDF_TEXT.TRANSCRIPT_SIGNATURE_LABELS],
}

// ── Cache configuration ─────────────────────────────────────────────────────
// 5-min TTL matching the existing cached-queries.ts pattern.
const CACHE_TTL = 60 * 5

// ── Template queries ────────────────────────────────────────────────────────

/**
 * Returns the active default template for a given type, or null.
 */
export async function getDefaultTemplate(type: 'CERTIFICATE' | 'TRANSCRIPT') {
  const cacheKey = `pdf-template:default:${type}`
  const fn = async () => {
    return prismaUnfiltered.pdfTemplate.findFirst({
      where: { type, isDefault: true, status: 'ACTIVE' },
      include: {
        signatures: {
          include: { signature: true },
          orderBy: { position: 'asc' },
        },
      },
    })
  }
  return unstable_cache(fn, [cacheKey], { revalidate: CACHE_TTL, tags: [`pdf-template:${type}`] })()
}

/**
 * Returns a template by ID with its signatures, or null.
 */
export async function getTemplateById(id: string) {
  const cacheKey = `pdf-template:id:${id}`
  const fn = async () => {
    return prismaUnfiltered.pdfTemplate.findUnique({
      where: { id },
      include: {
        signatures: {
          include: { signature: true },
          orderBy: { position: 'asc' },
        },
      },
    })
  }
  return unstable_cache(fn, [cacheKey], {
    revalidate: CACHE_TTL,
    tags: [`pdf-template:id:${id}`],
  })()
}

/**
 * List all templates, optionally filtered.
 */
export async function listTemplates(opts?: {
  type?: 'CERTIFICATE' | 'TRANSCRIPT'
  status?: 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
}) {
  return prismaUnfiltered.pdfTemplate.findMany({
    where: {
      ...(opts?.type && { type: opts.type }),
      ...(opts?.status && { status: opts.status }),
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Clone an existing template with a new name.
 * Copies all content, branding, and number format. Does NOT copy signatures.
 */
export async function cloneTemplate(sourceId: string, newName: string): Promise<{ id: string }> {
  const source = await prismaUnfiltered.pdfTemplate.findUnique({ where: { id: sourceId } })
  if (!source) throw new Error('Template not found')

  const slug = newName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  return prismaUnfiltered.pdfTemplate.create({
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
    select: { id: true },
  })
}

/**
 * Set a template as the default for its type. Unsets any existing default atomically.
 */
export async function setDefaultTemplate(id: string) {
  const template = await prismaUnfiltered.pdfTemplate.findUnique({ where: { id } })
  if (!template) throw new Error('Template not found')

  await prismaUnfiltered.$transaction([
    prismaUnfiltered.pdfTemplate.updateMany({
      where: { type: template.type, isDefault: true },
      data: { isDefault: false },
    }),
    prismaUnfiltered.pdfTemplate.update({
      where: { id },
      data: { isDefault: true },
    }),
  ])
}

/**
 * Format the next certificate number from a template's numberFormat.
 * Supports: {YYYY}, {YY}, {SEQ}, {SEQ:N} (zero-padded to N digits).
 * Returns the formatted string, e.g. "CERT-2026-0089".
 */
export function formatNextCertificateNumber(
  template: {
    numberFormat: string | null
    lastSequence: number
    lastSequenceYear: number | null
  },
  overrides?: { year?: number; sequence?: number }
): string {
  const year = overrides?.year ?? new Date().getFullYear()
  const seq = overrides?.sequence ?? template.lastSequence + 1

  let format = template.numberFormat ?? 'CERT-{YYYY}-{SEQ:4}'

  format = format.replace('{YYYY}', String(year))
  format = format.replace('{YY}', String(year).slice(-2))
  format = format.replace(/\{SEQ(?::(\d+))?\}/g, (_match, padStr: string | undefined) => {
    const pad = padStr ? parseInt(padStr, 10) : 4
    return String(seq).padStart(pad, '0')
  })

  return format
}

/**
 * Increment the sequence counter for a template. Called after a document is generated.
 * Resets to 1 when the year rolls over (lastSequenceYear differs from current year).
 */
export async function incrementTemplateSequence(id: string) {
  const year = new Date().getFullYear()
  const template = await prismaUnfiltered.pdfTemplate.findUnique({
    where: { id },
    select: { lastSequenceYear: true },
  })
  if (!template) return

  const newYear = template.lastSequenceYear !== year ? year : template.lastSequenceYear

  await prismaUnfiltered.pdfTemplate.update({
    where: { id },
    data: {
      lastSequence: { increment: 1 },
      lastSequenceYear: newYear,
    },
  })
}

/**
 * Resolve template content with fallbacks to defaults.
 */
export function resolveTemplateContent(
  template: { content: unknown },
  defaults: CertificateContent | TranscriptContent
): CertificateContent | TranscriptContent {
  const stored = (template.content ?? {}) as Record<string, unknown>
  return { ...defaults, ...stored } as CertificateContent | TranscriptContent
}

/**
 * Resolve branding: template-level overrides merged with global settings.
 */
export function mergeBrandingOverrides(
  templateBranding: unknown,
  global: TemplateBranding
): TemplateBranding {
  const overrides = (templateBranding ?? {}) as Partial<TemplateBranding>
  return { ...global, ...overrides }
}

// ── Resolved signatures ─────────────────────────────────────────────────────

/**
 * Read a remote URL and return its body as a Buffer along with the detected
 * image MIME type. Supports PNG and JPEG (the only formats @react-pdf/renderer
 * can embed). Returns null if the body is empty or the format is unsupported.
 */
async function fetchImageAsDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`[pdf-templates] failed to fetch signature image: ${res.status}`)
      return null
    }
    const arrayBuffer = await res.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    if (buffer.length === 0) return null

    let mime: string | null = null
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      mime = 'image/png'
    } else if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
      mime = 'image/jpeg'
    }

    if (!mime) {
      console.error('[pdf-templates] signature image is not PNG/JPEG')
      return null
    }

    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch (err) {
    console.error('[pdf-templates] error fetching signature image:', err)
    return null
  }
}

/**
 * Resolve the signatures attached to a template as base64 data URIs ready to
 * be embedded in a @react-pdf/renderer document. Skips signatures that are
 * inactive, expired, or whose image cannot be read — callers can assume every
 * returned entry is renderable.
 */
export async function getResolvedSignatures(templateId: string): Promise<ResolvedSignature[]> {
  const template = await prismaUnfiltered.pdfTemplate.findUnique({
    where: { id: templateId },
    include: {
      signatures: {
        include: { signature: true },
        orderBy: { position: 'asc' },
      },
    },
  })

  if (!template) return []

  const now = new Date()
  const activeAssignments = template.signatures.filter((assignment) => {
    const sig = assignment.signature
    if (!sig.isActive) return false
    if (sig.expiresAt && sig.expiresAt < now) return false
    return true
  })

  const resolved: ResolvedSignature[] = []
  const signedUrls = await Promise.all(
    activeAssignments.map((assignment) => getSignedUrl(assignment.signature.imageUrl))
  )

  const fetchPromises = activeAssignments.map(async (assignment, i) => {
    const signedUrl = signedUrls[i]
    if (!signedUrl) return null
    const imageDataUri = await fetchImageAsDataUri(signedUrl)
    if (!imageDataUri) return null
    return {
      label: assignment.signature.label,
      signerName: assignment.signature.signerName,
      imageDataUri,
      position: assignment.position,
      expiresAt: assignment.signature.expiresAt,
    } as ResolvedSignature
  })

  const results = await Promise.all(fetchPromises)
  for (const r of results) {
    if (r) resolved.push(r)
  }

  return resolved
}
