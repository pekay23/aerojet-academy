import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST, DELETE } from '@/app/api/staff/email-templates/route'
import { NextRequest } from 'next/server'

// Mock Prisma — route uses prismaUnfiltered (named export)
vi.mock('@/lib/prisma/client', () => {
  const emailTemplate = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  }
  return {
    default: { emailTemplate },
    prismaUnfiltered: { emailTemplate },
  }
})

// Mock Auth
vi.mock('@/lib/auth/helpers', () => ({
  getAuthSession: vi.fn(),
}))

import prisma from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'

describe('Email Templates API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 if unauthorized', async () => {
    vi.mocked(getAuthSession).mockResolvedValue(null)
    const req = new NextRequest('http://localhost/api/staff/email-templates')
    const res = await GET(req)
    expect(res.status).toBe(401)
  })

  it('GET / returns all templates for staff', async () => {
    vi.mocked(getAuthSession).mockResolvedValue({
      user: { id: 'user-1', role: 'STAFF' },
    } as any)
    vi.mocked(prisma.emailTemplate.findMany).mockResolvedValue([
      { id: '1', name: 'template1', subject: 'Subject 1', body: 'Body 1', updatedAt: new Date() },
    ] as any)

    const req = new NextRequest('http://localhost/api/staff/email-templates')
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toHaveLength(1)
    expect(json[0].name).toBe('template1')
  })

  it('GET /?name=test returns a single template', async () => {
    vi.mocked(getAuthSession).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    } as any)
    vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue({
      name: 'registration',
      subject: 'Welcome',
    } as any)

    const req = new NextRequest('http://localhost/api/staff/email-templates?name=registration')
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.name).toBe('registration')
  })

  it('POST / saves a template', async () => {
    vi.mocked(getAuthSession).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    } as any)
    vi.mocked(prisma.emailTemplate.upsert).mockResolvedValue({
      name: 'test',
      subject: 'Sub',
      body: 'Body',
    } as any)

    const req = new NextRequest('http://localhost/api/staff/email-templates', {
      method: 'POST',
      body: JSON.stringify({ name: 'test', subject: 'Sub', body: 'Body' }),
    })
    const res = await POST(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.name).toBe('test')
    expect(prisma.emailTemplate.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { name: 'test' },
        create: expect.objectContaining({ subject: 'Sub' }),
      })
    )
  })

  it('DELETE / removes a template', async () => {
    vi.mocked(getAuthSession).mockResolvedValue({
      user: { id: 'user-1', role: 'ADMIN' },
    } as any)

    const req = new NextRequest('http://localhost/api/staff/email-templates?name=test', {
      method: 'DELETE',
    })
    const res = await DELETE(req)

    expect(res.status).toBe(204)
    expect(prisma.emailTemplate.delete).toHaveBeenCalledWith({
      where: { name: 'test' },
    })
  })
})
