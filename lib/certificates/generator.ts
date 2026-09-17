import 'server-only'
import React from 'react'
import { renderToStream } from '@react-pdf/renderer'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { uploadToStorage, getSignedUrl } from '@/lib/storage/supabase-storage'
import { getSystemSetting } from '@/lib/settings'
import { getPDFSettings } from '@/lib/pdf-settings'
import { CertificateTemplate } from '@/components/pdf/templates/CertificateTemplate'
import { createAuditLog, AuditAction } from '@/lib/audit/logger'
import { getRequestContext } from '@/lib/server/request-context'
import QRCode from 'qrcode'
import crypto from 'crypto'
import {
  getDefaultTemplate,
  formatNextCertificateNumber,
  incrementTemplateSequence,
} from '@/lib/pdf-templates'
import {
  createVerificationRecord,
} from '@/lib/document-verification'

export interface CertificateData {
  certificateId: string
  studentName: string
  courseName: string
  moduleCode: string
  score: number
  percentage: number
  date: string
  passMarkPct?: number
}

export interface CertificatePdfOptions {
  logoUrl?: string
  watermarkUrl?: string
  watermarkOpacity?: number
  footerText?: string
}

const STORAGE_BASE_PATH = 'certificates'

export async function getCertificatesEnabled(): Promise<boolean> {
  const value = await getSystemSetting('certificates_enabled', 'false')
  return value === 'true'
}

export function generateCertificateNumber(): string {
  const year = new Date().getFullYear()
  const seq = crypto.randomInt(1, 99999)
  return `CERT-${year}-${String(seq).padStart(4, '0')}`
}

export function getCertificateVerifyUrl(certificateId: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  return `${base}/verify/${certificateId}`
}

export async function generateCertificateQrDataUrl(certificateId: string): Promise<string> {
  const url = getCertificateVerifyUrl(certificateId)
  return QRCode.toDataURL(url, { width: 120, margin: 1 })
}

function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }
  return str.replace(/[&<>"']/g, (c) => map[c] || c)
}

export function renderCertificateTemplate(data: CertificateData): string {
  const {
    certificateId,
    studentName,
    courseName,
    moduleCode,
    score,
    percentage,
    date,
    passMarkPct,
  } = data
  const passed = passMarkPct != null && percentage >= passMarkPct
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Certificate — ${certificateId}</title>
  <style>
    body { font-family: serif; text-align: center; padding: 48px; }
    .title { font-size: 24px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px; }
    .name { font-size: 20px; font-weight: bold; margin: 24px 0; }
    .desc { font-size: 12px; line-height: 1.5; color: #334155; }
    .course { font-size: 14px; font-weight: bold; margin: 16px 0; }
    .badge { display: inline-block; background: #b8860b; color: #fff; padding: 4px 12px; font-size: 10px; text-transform: uppercase; border-radius: 4px; }
    .cert-no { font-size: 10px; color: #64748b; letter-spacing: 1px; }
    .date { font-size: 11px; color: #334155; }
  </style>
</head>
<body>
  <div class="title">Certificate of Completion</div>
  <p class="desc">This is to certify that</p>
  <div class="name">${escapeHtml(studentName)}</div>
  <p class="desc">has successfully completed the prescribed training and assessment requirements for</p>
  <div class="course">${escapeHtml(courseName)}</div>
  <p class="desc">Module: ${escapeHtml(moduleCode ?? '')}</p>
  <p class="desc">Score: ${score} &bull; Percentage: ${percentage.toFixed(1)}%${passMarkPct != null ? ` &bull; Pass Mark: ${passMarkPct}%` : ''}</p>
  ${passed ? '<div class="badge" style="margin: 16px 0;">PASSED</div>' : ''}
  <div class="cert-no">Certificate No. ${escapeHtml(certificateId)}</div>
  <div class="date">Issued on ${escapeHtml(date)}</div>
</body>
</html>`
}

async function streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export async function generateCertificatePdf(
  data: CertificateData,
  options: CertificatePdfOptions = {}
): Promise<Buffer> {
  const settings = await getPDFSettings(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')
  const logoUrl = options.logoUrl ?? settings.logoUrl
  const watermarkUrl = options.watermarkUrl ?? settings.watermarkUrl
  const watermarkOpacity = options.watermarkOpacity ?? settings.watermarkOpacity ?? 0.15
  const footerText = options.footerText ?? settings.footerText

  const qrDataUrl = await generateCertificateQrDataUrl(data.certificateId)

  const stream = await renderToStream(
    React.createElement(CertificateTemplate, {
      logoUrl,
      watermarkUrl,
      watermarkOpacity,
      footerText,
      studentName: data.studentName,
      programName: data.courseName,
      issueDate: data.date,
      certificateNumber: data.certificateId,
      moduleCode: data.moduleCode,
      score: data.score,
      percentage: data.percentage,
      passMarkPct: data.passMarkPct,
      qrDataUrl,
    }) as unknown as React.ReactElement<Record<string, unknown>>
  )

  return streamToBuffer(stream)
}

export function buildCertificateStoragePath(certificateId: string): string {
  return `${STORAGE_BASE_PATH}/${certificateId}.pdf`
}

export async function uploadCertificateToStorage(
  certificateId: string,
  buffer: Buffer
): Promise<string> {
  const path = buildCertificateStoragePath(certificateId)
  await uploadToStorage(path, buffer, 'application/pdf')
  return path
}

export async function getCertificateDownloadUrl(
  pdfUrl: string | null | undefined,
  expiresInSeconds = 60 * 60 * 24
): Promise<string | null> {
  if (!pdfUrl) return null
  return getSignedUrl(pdfUrl, expiresInSeconds)
}

export interface CreateCertificateParams {
  sessionId: string
  studentId: string
  courseId?: string | null
  moduleCode?: string | null
  score: number
  percentage: number
  passMarkPct?: number
  issuedBy?: string
}

export interface CreateCertificateResult {
  id: string
  certificateId: string
  pdfUrl: string
  issuedAt: Date
}

export async function createCertificate(params: CreateCertificateParams): Promise<CreateCertificateResult> {
  const { sessionId, studentId, courseId, moduleCode, score, percentage, passMarkPct, issuedBy } = params

  const existing = await prismaUnfiltered.certificate.findFirst({
    where: { sessionId },
  })
  if (existing) {
    return {
      id: existing.id,
      certificateId: existing.certificateId,
      pdfUrl: existing.pdfUrl || '',
      issuedAt: existing.issuedAt,
    }
  }

  // ── Use template numbering if a default template exists ──
  const templateEnabled = await getSystemSetting('pdf_template_system_enabled', 'false')
  const template = templateEnabled === 'true' ? await getDefaultTemplate('CERTIFICATE') : null
  let certificateId: string

  if (template) {
    certificateId = formatNextCertificateNumber(template)
  } else {
    certificateId = generateCertificateNumber()
  }

  const issuedAt = new Date()
  const dateStr = issuedAt.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

  const [session, user] = await Promise.all([
    prismaUnfiltered.internalExamSession.findUnique({
      where: { id: sessionId },
      select: {
        bank: {
          select: {
            name: true,
            moduleCode: true,
            courseId: true,
            course: { select: { code: true, name: true } },
          },
        },
      },
    }),
    prismaUnfiltered.user.findUnique({
      where: { id: studentId },
      select: {
        profile: { select: { firstName: true, lastName: true } },
        email: true,
      },
    }),
  ])

  const studentName =
    user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user?.email || 'Student'

  const courseName = session?.bank?.course?.name || session?.bank?.name || 'Internal Exam'
  const resolvedModuleCode = moduleCode || session?.bank?.moduleCode || ''
  const resolvedCourseId = courseId || session?.bank?.courseId || null

  const pdfData: CertificateData = {
    certificateId,
    studentName,
    courseName,
    moduleCode: resolvedModuleCode,
    score,
    percentage,
    date: dateStr,
    passMarkPct,
  }

  const pdfBuffer = await generateCertificatePdf(pdfData)
  const pdfUrl = await uploadCertificateToStorage(certificateId, pdfBuffer)

  // ── Increment template sequence counter ──
  if (template) {
    await incrementTemplateSequence(template.id)
  }

  const certificate = await prismaUnfiltered.certificate.create({
    data: {
      certificateId,
      sessionId,
      studentId,
      courseId: resolvedCourseId,
      moduleCode: resolvedModuleCode || null,
      template: 'internal_exam',
      score,
      percentage,
      issuedAt,
      issuedBy,
      pdfUrl,
      verified: true,
    },
  })

  // ── Create verification record for QR code ──
  await createVerificationRecord({
    templateId: template?.id ?? undefined,
    recipientName: studentName,
    documentType: 'Certificate',
    certificateNo: certificateId,
    issueDate: issuedAt,
    generatedBy: issuedBy ?? undefined,
  })

  const ctx = await getRequestContext().catch(() => ({ ipAddress: undefined, userAgent: undefined }))
  await createAuditLog({
    userId: issuedBy,
    action: AuditAction.CREATE,
    entity: 'Certificate',
    entityId: certificate.id,
    description: `Certificate ${certificateId} issued for student ${studentName} (${score}/${percentage.toFixed(1)}%)`,
    changes: { certificateId, sessionId, studentId },
    ipAddress: ctx.ipAddress ?? undefined,
    userAgent: ctx.userAgent ?? undefined,
  })

  return {
    id: certificate.id,
    certificateId,
    pdfUrl,
    issuedAt,
  }
}

export async function getCertificateByNumber(certificateId: string) {
  return prismaUnfiltered.certificate.findUnique({
    where: { certificateId },
    include: {
      student: {
        select: {
          id: true,
          email: true,
          profile: { select: { firstName: true, lastName: true } },
          studentProfile: { select: { studentId: true } },
        },
      },
    },
  })
}

export async function getCertificateDownloadSession(certificateId: string) {
  return prismaUnfiltered.certificate.findUnique({
    where: { certificateId },
    select: {
      id: true,
      certificateId: true,
      sessionId: true,
      studentId: true,
      pdfUrl: true,
    },
  })
}
