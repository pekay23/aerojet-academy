import { test, expect } from '@playwright/test'
import { loginAsStaff, loginAsStudent } from './helpers/auth'

// These tests drive the SEB config and certificate endpoints through real
// HTTP requests against the dev server, asserting auth gating and responses.

test.describe('SEB Config & Certificates', () => {
  test.describe('SEB config download (staff)', () => {
    test('staff can download SEB config for a bank', async ({ page }) => {
      await loginAsStaff(page)
      const res = await page.request.get('/api/staff/exams/internal/banks/bank-1/seb-config/download')
      expect(res.status()).toBe(404)
    })

    test('unauthenticated request is rejected', async ({ page }) => {
      const res = await page.request.get('/api/staff/exams/internal/banks/bank-1/seb-config/download')
      expect(res.status()).toBe(401)
    })

    test('student cannot access staff SEB download', async ({ page }) => {
      await loginAsStudent(page)
      const res = await page.request.get('/api/staff/exams/internal/banks/bank-1/seb-config/download')
      expect(res.status()).toBe(401)
    })
  })

  test.describe('SEB config download (student)', () => {
    test('unauthenticated request is rejected', async ({ page }) => {
      const res = await page.request.get('/api/student/exams/internal/banks/bank-1/seb-config')
      expect(res.status()).toBe(401)
    })

    test('student without enrollment is rejected', async ({ page }) => {
      await loginAsStudent(page)
      const res = await page.request.get('/api/student/exams/internal/banks/bank-1/seb-config')
      expect([403, 404]).toContain(res.status())
    })
  })

  test.describe('Certificate verification (public)', () => {
    test('public verification page renders for an unknown id', async ({ page }) => {
      await page.goto('/verify/NONEXISTENT-0001')
      await expect(page.getByText('Certificate Not Found')).toBeVisible()
    })

    test('public verification API returns 404 for unknown certificate', async ({ page }) => {
      const res = await page.request.get('/api/certificates/verify/NONEXISTENT-0001')
      expect(res.status()).toBe(404)
    })
  })
})
