import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { NextRequest } from 'next/server'

import { POST } from '@/app/api/webhooks/uploadthing/route.ts'

const ENV_KEY = 'UPLOADTHING_SECRET'
const originalEnv: Record<string, string | undefined> = {}

function saveEnv() {
  originalEnv[ENV_KEY] = process.env[ENV_KEY]
}

function restoreEnv() {
  if (originalEnv[ENV_KEY] === undefined) delete process.env[ENV_KEY]
  else process.env[ENV_KEY] = originalEnv[ENV_KEY]
}

function setEnv(values: Record<string, string | undefined>) {
  Object.entries(values).forEach(([k, v]) => {
    if (v === undefined) delete process.env[k]
    else process.env[k] = v
  })
}

const VALID_SECRET = 'ut-test-secret'

describe('POST /api/webhooks/uploadthing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    prismaMock.$transaction.mockImplementation((fn) => fn(prismaMock))
    saveEnv()
  })

  afterEach(() => {
    restoreEnv()
  })

  describe('POST', () => {
    it('returns 401 when UPLOADTHING_SECRET is set and bearer token does not match', async () => {
      setEnv({ UPLOADTHING_SECRET: VALID_SECRET })
      const req = new NextRequest('http://localhost/api/webhooks/uploadthing', {
        method: 'POST',
        headers: { Authorization: 'Bearer wrong-secret' },
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'Unauthorized' })
    })

    it('returns 401 when UPLOADTHING_SECRET is set and no auth header is present', async () => {
      setEnv({ UPLOADTHING_SECRET: VALID_SECRET })
      const req = new NextRequest('http://localhost/api/webhooks/uploadthing', {
        method: 'POST',
        headers: {},
        body: JSON.stringify({}),
      })
      const res = await POST(req)
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: 'Unauthorized' })
    })

    it('passes auth when uploadthing-hook header is present', async () => {
      setEnv({ UPLOADTHING_SECRET: VALID_SECRET })
      prismaMock.fileUpload.create.mockResolvedValue({ id: 'file-1' } as any)

      const req = new NextRequest('http://localhost/api/webhooks/uploadthing', {
        method: 'POST',
        headers: { 'uploadthing-hook': 'true' },
        body: JSON.stringify({
          file: {
            name: 'test.pdf',
            url: 'https://test.com/file.pdf',
            type: 'application/pdf',
            size: 1024,
          },
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(prismaMock.fileUpload.create).toHaveBeenCalled()
    })

    it('returns 400 for invalid input (no file)', async () => {
      setEnv({ UPLOADTHING_SECRET: VALID_SECRET })
      const req = new NextRequest('http://localhost/api/webhooks/uploadthing', {
        method: 'POST',
        headers: { Authorization: `Bearer ${VALID_SECRET}` },
        body: JSON.stringify({ invalid: 'data' }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: 'Invalid payload' })
    })

    it('returns 400 when file has no url', async () => {
      setEnv({ UPLOADTHING_SECRET: VALID_SECRET })
      const req = new NextRequest('http://localhost/api/webhooks/uploadthing', {
        method: 'POST',
        headers: { Authorization: `Bearer ${VALID_SECRET}` },
        body: JSON.stringify({ file: { name: 'test' } }),
      })
      const res = await POST(req)
      expect(res.status).toBe(400)
      expect(await res.json()).toEqual({ error: 'Invalid payload' })
    })

    it('returns 200 and creates a file upload record on success', async () => {
      setEnv({ UPLOADTHING_SECRET: VALID_SECRET })
      prismaMock.fileUpload.create.mockResolvedValue({ id: 'file-1' } as any)

      const req = new NextRequest('http://localhost/api/webhooks/uploadthing', {
        method: 'POST',
        headers: { Authorization: `Bearer ${VALID_SECRET}` },
        body: JSON.stringify({
          file: {
            name: 'test.pdf',
            url: 'https://test.com/file.pdf',
            type: 'application/pdf',
            size: 1024,
          },
          metadata: { userId: 'user-1', entityType: 'GENERAL' },
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ success: true, fileId: 'file-1' })
      expect(prismaMock.fileUpload.create).toHaveBeenCalledWith({
        data: {
          filename: 'test.pdf',
          originalName: 'test.pdf',
          url: 'https://test.com/file.pdf',
          mimeType: 'application/pdf',
          size: 1024,
          userId: 'user-1',
          fileType: 'GENERAL',
          referenceType: 'GENERAL',
          referenceId: undefined,
        },
      })
    })

    it('uses default values when file fields are missing', async () => {
      setEnv({ UPLOADTHING_SECRET: VALID_SECRET })
      prismaMock.fileUpload.create.mockResolvedValue({ id: 'file-1' } as any)

      const req = new NextRequest('http://localhost/api/webhooks/uploadthing', {
        method: 'POST',
        headers: { Authorization: `Bearer ${VALID_SECRET}` },
        body: JSON.stringify({
          file: { url: 'https://test.com/minimal.pdf' },
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(prismaMock.fileUpload.create).toHaveBeenCalledWith({
        data: {
          filename: 'unknown',
          originalName: 'unknown',
          url: 'https://test.com/minimal.pdf',
          mimeType: 'application/octet-stream',
          size: 0,
          userId: undefined,
          fileType: 'GENERAL',
          referenceType: undefined,
          referenceId: undefined,
        },
      })
    })

    it('updates payment proof when entityType is PaymentProof', async () => {
      setEnv({ UPLOADTHING_SECRET: VALID_SECRET })
      prismaMock.fileUpload.create.mockResolvedValue({ id: 'file-1' } as any)
      prismaMock.payment.update.mockResolvedValue({
        id: 'pay-1',
        proofUrl: 'https://test.com/proof.pdf',
      } as any)

      const req = new NextRequest('http://localhost/api/webhooks/uploadthing', {
        method: 'POST',
        headers: { Authorization: `Bearer ${VALID_SECRET}` },
        body: JSON.stringify({
          file: {
            name: 'proof.pdf',
            url: 'https://test.com/proof.pdf',
            type: 'application/pdf',
            size: 512,
          },
          metadata: {
            userId: 'user-1',
            entityType: 'PaymentProof',
            entityId: 'pay-1',
          },
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ success: true, fileId: 'file-1' })
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: 'pay-1' },
        data: { proofUrl: 'https://test.com/proof.pdf' },
      })
    })

    it('does not update payment when entityType is PaymentProof but userId is missing', async () => {
      setEnv({ UPLOADTHING_SECRET: VALID_SECRET })
      prismaMock.fileUpload.create.mockResolvedValue({ id: 'file-1' } as any)
      prismaMock.payment.update.mockResolvedValue({} as any)

      const req = new NextRequest('http://localhost/api/webhooks/uploadthing', {
        method: 'POST',
        headers: { Authorization: `Bearer ${VALID_SECRET}` },
        body: JSON.stringify({
          file: {
            name: 'proof.pdf',
            url: 'https://test.com/proof.pdf',
            type: 'application/pdf',
            size: 512,
          },
          metadata: {
            entityType: 'PaymentProof',
            entityId: 'pay-1',
          },
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(prismaMock.payment.update).not.toHaveBeenCalled()
    })

    it('returns 500 when prisma create throws an error', async () => {
      setEnv({ UPLOADTHING_SECRET: VALID_SECRET })
      vi.spyOn(console, 'error').mockImplementation(() => {})
      prismaMock.fileUpload.create.mockRejectedValue(new Error('DB error'))

      const req = new NextRequest('http://localhost/api/webhooks/uploadthing', {
        method: 'POST',
        headers: { Authorization: `Bearer ${VALID_SECRET}` },
        body: JSON.stringify({
          file: {
            name: 'test.pdf',
            url: 'https://test.com/file.pdf',
            type: 'application/pdf',
            size: 1024,
          },
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(500)
      expect(await res.json()).toEqual({ error: 'DB error' })
    })

    it('skips auth when UPLOADTHING_SECRET is not set', async () => {
      setEnv({ UPLOADTHING_SECRET: undefined })
      prismaMock.fileUpload.create.mockResolvedValue({ id: 'file-1' } as any)

      const req = new NextRequest('http://localhost/api/webhooks/uploadthing', {
        method: 'POST',
        headers: {},
        body: JSON.stringify({
          file: {
            name: 'test.pdf',
            url: 'https://test.com/file.pdf',
            type: 'application/pdf',
            size: 1024,
          },
        }),
      })
      const res = await POST(req)
      expect(res.status).toBe(200)
      expect(await res.json()).toEqual({ success: true, fileId: 'file-1' })
    })
  })
})
