import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'
import { GET as sittingsGET } from '@/app/api/examiner/sittings/route'
import { GET as resultsGET, POST as resultsPOST } from '@/app/api/examiner/results/route'
import { GET as complianceGET } from '@/app/api/examiner/compliance/route'
import { GET as availabilityGET, POST as availabilityPOST } from '@/app/api/examiner/availability/route'

vi.mock('@/lib/auth/helpers', () => ({
  requireExaminer: vi.fn(),
}))

vi.mock('@/lib/audit/logger', () => ({
  createAuditLog: vi.fn(),
  AuditAction: { CREATE: 'CREATE', UPDATE: 'UPDATE', DELETE: 'DELETE' },
}))

vi.mock('@/lib/analytics/events', () => ({
  trackExamCompletion: vi.fn().mockResolvedValue(undefined),
}))

import { requireExaminer } from '@/lib/auth/helpers'

describe('/api/examiner/sittings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireExaminer as any).mockResolvedValue({ id: 'user-1' })
    prismaMock.examiner.findUnique.mockResolvedValue({ id: 'examiner-1' })
    prismaMock.examSitting.findMany.mockResolvedValue([])
    prismaMock.examSitting.count.mockResolvedValue(0)
  })

  it('returns paginated sittings', async () => {
    const req = new NextRequest('http://localhost/api/examiner/sittings?page=1&limit=10')
    const res = await sittingsGET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json).toHaveProperty('data')
  })

  it('returns 404 when examiner profile not found', async () => {
    prismaMock.examiner.findUnique.mockResolvedValueOnce(null)
    const req = new NextRequest('http://localhost/api/examiner/sittings')
    const res = await sittingsGET(req)
    expect(res.status).toBe(404)
  })
})

describe('/api/examiner/results', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireExaminer as any).mockResolvedValue({ id: 'user-1' })
    prismaMock.examiner.findUnique.mockResolvedValue({ id: 'examiner-1' })
    prismaMock.examSitting.findMany.mockResolvedValue([])
    prismaMock.examSitting.count.mockResolvedValue(0)
    prismaMock.examResult.findMany.mockResolvedValue([])
  })

  it('returns sittings and existing results', async () => {
    const req = new NextRequest('http://localhost/api/examiner/results')
    const res = await resultsGET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveProperty('sittings')
    expect(json.data).toHaveProperty('existingResults')
  })

  it('returns 405 for POST', async () => {
    const req = new NextRequest('http://localhost/api/examiner/results', { method: 'POST' })
    const res = await resultsPOST(req)
    expect(res.status).toBe(405)
  })
})

describe('/api/examiner/compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireExaminer as any).mockResolvedValue({ id: 'user-1' })
    prismaMock.examiner.findUnique.mockResolvedValue({
      id: 'examiner-1',
      isActive: true,
      maxParallelSittings: 2,
      createdAt: new Date('2024-01-01'),
      user: { profile: { firstName: 'Test', lastName: 'User' } },
    })
    prismaMock.examSitting.count.mockResolvedValue(5)
  })

  it('returns compliance data', async () => {
    const req = new NextRequest('http://localhost/api/examiner/compliance')
    const res = await complianceGET(req)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveProperty('completedSittings')
    expect(json.data).toHaveProperty('upcomingSittings')
  })
})

describe('/api/examiner/availability', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(requireExaminer as any).mockResolvedValue({ id: 'user-1' })
    prismaMock.staffAvailability.findMany.mockResolvedValue([])
  })

  it('returns availability slots', async () => {
    const req = new NextRequest('http://localhost/api/examiner/availability')
    const res = await availabilityGET(req)
    expect(res.status).toBe(200)
  })
})
