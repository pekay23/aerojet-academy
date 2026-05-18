import { Page, expect } from '@playwright/test'

/**
 * E2E Auth Helper
 *
 * Uses environment variables for test credentials.
 * Falls back to seeded defaults if env vars are not set.
 * Set E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD etc. in .env.test or CI secrets.
 */

interface TestCredentials {
  email: string
  password: string
}

export function getStudentCredentials(): TestCredentials {
  return {
    email: process.env.E2E_STUDENT_EMAIL || 'student@aerojet-academy.com',
    password: process.env.E2E_STUDENT_PASSWORD || 'Student@2026',
  }
}

export function getStaffCredentials(): TestCredentials {
  return {
    email: process.env.E2E_STAFF_EMAIL || 'admin@aerojet-academy.com',
    password: process.env.E2E_STAFF_PASSWORD || 'Admin@2026',
  }
}

/**
 * Login as a specific role and wait for the portal to load.
 * @param page - Playwright page
 * @param creds - Credentials to use
 */
export async function loginAs(page: Page, creds: TestCredentials) {
  await page.goto('/login')
  await page.fill('#email', creds.email)
  await page.fill('#password', creds.password)
  await page.click('button[type="submit"]')
  await expect(page.locator('body')).toContainText(/Dashboard|Welcome/i, { timeout: 30000 })
}
