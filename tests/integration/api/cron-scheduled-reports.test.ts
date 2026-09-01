import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/email/service', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  sendBulkEmails: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/lib/env', () => ({
  env: { CRON_SECRET: 'test-secret', NEXTAUTH_URL: 'http://localhost:3000' }
}))

vi.mock('@/lib/analytics/reports', () => ({
  getFinanceReportSummary: vi.fn().mockReturnValue({ success: true }),
  getYoYComparison: vi.fn().mockReturnValue({ success: true })
}))

vi.mock('@/lib/email/sender', () => ({
  sendEmail: vi.fn().mockReturnValue({ success: true })
}))

import { GET } from '@/app/api/cron/scheduled-reports/route.ts'

describe('GET /api/cron/scheduled-reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
  })

  describe('GET', () => {
    it('returns feature disabled message', async () => {
      const req = new NextRequest('http://localhost/api/cron/scheduled-reports')
      const res = await GET(req)
      expect(res.status).toBe(200)
      const json = await res.json()
      expect(json.success).toBe(true)
      expect(json.message).toBe('Feature disabled')
    })

  })

})
