import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/prisma/client', () => ({
  prismaUnfiltered: {
    certificate: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    internalExamSession: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    studentProfile: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('@/lib/storage/supabase-storage', () => ({
  uploadToStorage: vi.fn(),
  getSignedUrl: vi.fn(),
}))

vi.mock('@/lib/settings', () => ({
  getSystemSetting: vi.fn(),
}))

vi.mock('@/lib/pdf-settings', () => ({
  getPDFSettings: vi.fn().mockResolvedValue({
    logoUrl: '',
    watermarkUrl: '',
    watermarkOpacity: 0.15,
    footerText: '',
  }),
}))

vi.mock('@/components/pdf/templates/CertificateTemplate', () => ({
  CertificateTemplate: () => null,
}))

vi.mock('@react-pdf/renderer', () => ({
  renderToStream: vi.fn().mockResolvedValue({} as NodeJS.ReadableStream),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE' },
}))

vi.mock('@/lib/server/request-context', () => ({
  getRequestContext: vi.fn().mockResolvedValue({ ipAddress: undefined, userAgent: undefined }),
}))

vi.mock('server-only', () => ({}))

import { prismaUnfiltered } from '@/lib/prisma/client'
import { uploadToStorage, getSignedUrl } from '@/lib/storage/supabase-storage'
import { getSystemSetting } from '@/lib/settings'
import { getPDFSettings } from '@/lib/pdf-settings'
import {
  generateCertificateNumber,
  renderCertificateTemplate,
  getCertificatesEnabled,
  uploadCertificateToStorage,
  buildCertificateStoragePath,
  getCertificateDownloadUrl,
  getCertificateByNumber,
} from '@/lib/certificates/generator'

describe('lib/certificates/generator', () => {
  const baseCertificateData = {
    certificateId: 'CERT-2026-0001',
    studentName: 'John Doe',
    courseName: 'EASA Part-66 B1.1 Aircraft Maintenance',
    moduleCode: 'M01',
    score: 36,
    percentage: 90.0,
    date: '31 Aug 2026',
    passMarkPct: 75,
  }

  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(getPDFSettings).mockResolvedValue({
      logoUrl: '',
      watermarkUrl: '',
      watermarkOpacity: 0.15,
      footerText: '',
    })
  })

  describe('generateCertificateNumber', () => {
    it('generates certificate number with correct format', () => {
      const result = generateCertificateNumber()
      expect(result).toMatch(/^CERT-\d{4}-\d{4}$/)
    })

    it('generates unique numbers', () => {
      const num1 = generateCertificateNumber()
      const num2 = generateCertificateNumber()
      expect(num1).not.toBe(num2)
    })
  })

  describe('renderCertificateTemplate', () => {
    it('renders template with student name', () => {
      const html = renderCertificateTemplate(baseCertificateData)
      expect(html).toContain('John Doe')
    })

    it('renders template with course name', () => {
      const html = renderCertificateTemplate(baseCertificateData)
      expect(html).toContain('EASA Part-66 B1.1 Aircraft Maintenance')
    })

    it('renders template with module code', () => {
      const html = renderCertificateTemplate(baseCertificateData)
      expect(html).toContain('M01')
    })

    it('renders template with percentage', () => {
      const html = renderCertificateTemplate(baseCertificateData)
      expect(html).toContain('90.0%')
    })

    it('renders template with score', () => {
      const html = renderCertificateTemplate(baseCertificateData)
      expect(html).toContain('36')
    })

    it('renders template with certificate id', () => {
      const html = renderCertificateTemplate(baseCertificateData)
      expect(html).toContain('CERT-2026-0001')
    })

    it('renders template with date', () => {
      const html = renderCertificateTemplate(baseCertificateData)
      expect(html).toContain('31 Aug 2026')
    })

    it('renders valid HTML structure', () => {
      const html = renderCertificateTemplate(baseCertificateData)
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('</html>')
    })

    it('escapes HTML special characters in student name', () => {
      const data = { ...baseCertificateData, studentName: '<script>alert("xss")</script>' }
      const html = renderCertificateTemplate(data)
      expect(html).toContain('&lt;script&gt;')
      expect(html).not.toContain('<script>alert("xss")</script>')
    })

    it('shows PASSED badge when passed', () => {
      const html = renderCertificateTemplate(baseCertificateData)
      expect(html).toContain('PASSED')
    })

    it('does not show PASSED badge when not passed', () => {
      const html = renderCertificateTemplate({ ...baseCertificateData, percentage: 60 })
      expect(html).not.toContain('PASSED')
    })
  })

  describe('getCertificatesEnabled', () => {
    it('returns true when setting is "true"', async () => {
      vi.mocked(getSystemSetting).mockResolvedValueOnce('true')
      expect(await getCertificatesEnabled()).toBe(true)
    })

    it('returns false when setting is "false"', async () => {
      vi.mocked(getSystemSetting).mockResolvedValueOnce('false')
      expect(await getCertificatesEnabled()).toBe(false)
    })

    it('returns false when setting is absent (default)', async () => {
      vi.mocked(getSystemSetting).mockResolvedValueOnce('')
      expect(await getCertificatesEnabled()).toBe(false)
    })
  })

  describe('buildCertificateStoragePath', () => {
    it('builds path with certificates prefix', () => {
      const path = buildCertificateStoragePath('CERT-2026-0001')
      expect(path).toBe('certificates/CERT-2026-0001.pdf')
    })
  })

  describe('uploadCertificateToStorage', () => {
    it('uploads PDF buffer to storage', async () => {
      vi.mocked(uploadToStorage).mockResolvedValueOnce({ path: 'certificates/CERT-2026-0001.pdf' })

      const buffer = Buffer.from('fake-pdf')
      const result = await uploadCertificateToStorage('CERT-2026-0001', buffer)

      expect(uploadToStorage).toHaveBeenCalledWith(
        'certificates/CERT-2026-0001.pdf',
        buffer,
        'application/pdf'
      )
      expect(result).toBe('certificates/CERT-2026-0001.pdf')
    })
  })

  describe('getCertificateDownloadUrl', () => {
    it('returns null when pdfUrl is null', async () => {
      expect(await getCertificateDownloadUrl(null)).toBeNull()
    })

    it('returns null when pdfUrl is undefined', async () => {
      expect(await getCertificateDownloadUrl(undefined)).toBeNull()
    })

    it('returns signed url when pdfUrl is provided', async () => {
      vi.mocked(getSignedUrl).mockResolvedValueOnce('https://storage.test/signed-url')
      expect(await getCertificateDownloadUrl('path/to/cert.pdf')).toBe('https://storage.test/signed-url')
    })
  })

  describe('getCertificateByNumber', () => {
    it('finds certificate by certificateId', async () => {
      const mockCert = {
        id: 'cert-1',
        certificateId: 'CERT-2026-0001',
        studentId: 'student-1',
        moduleCode: 'M01',
        score: 36,
        percentage: 90,
        issuedAt: new Date(),
        pdfUrl: 'certificates/CERT-2026-0001.pdf',
        verified: true,
        student: {
          id: 'student-1',
          email: 'john@example.com',
          profile: { firstName: 'John', lastName: 'Doe' },
          studentProfile: { studentId: 'AATA-2026-0001' },
        },
      }
      vi.mocked(prismaUnfiltered.certificate.findUnique).mockResolvedValueOnce(mockCert as any)

      const result = await getCertificateByNumber('CERT-2026-0001')

      expect(prismaUnfiltered.certificate.findUnique).toHaveBeenCalledWith({
        where: { certificateId: 'CERT-2026-0001' },
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
      expect(result).toEqual(mockCert)
    })

    it('returns null when certificate not found', async () => {
      vi.mocked(prismaUnfiltered.certificate.findUnique).mockResolvedValueOnce(null)

      const result = await getCertificateByNumber('NONEXISTENT')

      expect(result).toBeNull()
    })
  })
})
