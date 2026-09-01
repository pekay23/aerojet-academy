import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
  requireStudent: vi.fn(),
  requireAuth: vi.fn(),
}))

import { GET } from '@/app/api/student/wallet/route'
import { requireStudent } from '@/lib/auth/helpers'

const mockUser = {
  id: 'user-1',
  email: 'student@test.com',
  role: 'STUDENT',
  firstName: 'John',
  lastName: 'Doe',
}

const mockWallet = {
  id: 'wallet-1',
  userId: 'user-1',
  balance: 1250.5,
  currency: 'EUR',
  createdAt: '2024-09-01T00:00:00.000Z',
  updatedAt: '2024-11-15T00:00:00.000Z',
}

describe('Student Wallet — GET /api/student/wallet', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(requireStudent).mockResolvedValue(mockUser as any)
  })

  it('returns 401 when unauthenticated', async () => {
    vi.mocked(requireStudent).mockRejectedValueOnce(new Error('Unauthorized'))
    const req = new NextRequest('http://localhost/api/student/wallet', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('returns 404 when wallet not found', async () => {
    prismaMock.wallet.findUnique.mockResolvedValueOnce(null)

    const req = new NextRequest('http://localhost/api/student/wallet', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(404)

    const json = await res.json()
    expect(json.success).toBe(false)
    expect(json.error).toContain('Wallet not found')
  })

  it('returns wallet with balance and currency on success', async () => {
    prismaMock.wallet.findUnique.mockResolvedValueOnce(mockWallet as any)

    const req = new NextRequest('http://localhost/api/student/wallet', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.success).toBe(true)
    expect(json.data).toHaveProperty('id', 'wallet-1')
    expect(json.data).toHaveProperty('balance', 1250.5)
    expect(json.data).toHaveProperty('currency', 'EUR')
    expect(json.data).toHaveProperty('userId', 'user-1')
  })

  it('queries wallet using authenticated user id', async () => {
    prismaMock.wallet.findUnique.mockResolvedValueOnce(mockWallet as any)

    const req = new NextRequest('http://localhost/api/student/wallet', { method: 'GET' })
    await GET(req)

    expect(prismaMock.wallet.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: 'user-1' } })
    )
  })

  it('returns wallet with zero balance', async () => {
    const emptyWallet = { ...mockWallet, balance: 0 }
    prismaMock.wallet.findUnique.mockResolvedValueOnce(emptyWallet as any)

    const req = new NextRequest('http://localhost/api/student/wallet', { method: 'GET' })
    const res = await GET(req)
    expect(res.status).toBe(200)

    const json = await res.json()
    expect(json.data.balance).toBe(0)
    expect(json.data.currency).toBe('EUR')
  })
})
