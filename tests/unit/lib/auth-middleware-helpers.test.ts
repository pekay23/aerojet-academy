import { describe, it, expect } from 'vitest'
import { redirectToLogin, redirectToPortal, jsonForbidden } from '@/lib/auth/middleware-helpers'
import { NextRequest, NextResponse } from 'next/server'

describe('lib/auth/middleware-helpers', () => {
  describe('redirectToLogin', () => {
    it('creates redirect to /login', () => {
      const req = new NextRequest('http://localhost:3000/protected')
      const result = redirectToLogin(req)
      expect(result.status).toBe(307)
      expect(result.headers.get('location')).toContain('/login')
    })

    it('appends error parameter', () => {
      const req = new NextRequest('http://localhost:3000/protected')
      const result = redirectToLogin(req, 'Session expired')
      expect(result.headers.get('location')).toContain('error=Session+expired')
    })
  })

  describe('redirectToPortal', () => {
    it('redirects SUPER_ADMIN to /staff', () => {
      const req = new NextRequest('http://localhost:3000/protected')
      const result = redirectToPortal(req, 'SUPER_ADMIN')
      expect(result.headers.get('location')).toContain('/staff')
    })

    it('redirects STUDENT to /student', () => {
      const req = new NextRequest('http://localhost:3000/protected')
      const result = redirectToPortal(req, 'STUDENT')
      expect(result.headers.get('location')).toContain('/student')
    })

    it('redirects INSTRUCTOR to /instructor', () => {
      const req = new NextRequest('http://localhost:3000/protected')
      const result = redirectToPortal(req, 'INSTRUCTOR')
      expect(result.headers.get('location')).toContain('/instructor')
    })

    it('redirects APPLICANT to /applicant', () => {
      const req = new NextRequest('http://localhost:3000/protected')
      const result = redirectToPortal(req, 'APPLICANT')
      expect(result.headers.get('location')).toContain('/applicant')
    })
  })

  describe('jsonForbidden', () => {
    it('returns 403 JSON response', () => {
      const result = jsonForbidden()
      expect(result.status).toBe(403)
      expect(result.headers.get('content-type')).toContain('application/json')
    })

    it('uses custom message', () => {
      const result = jsonForbidden('Access denied')
      expect(result.status).toBe(403)
    })
  })
})
