import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

async function login(page: any, email: string, password: string) {
  await page.goto('/login')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  // Wait for navigation away from login page
  await page.waitForURL((url: URL) => url.pathname !== '/login', { timeout: 20000 })
}

function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    console.error(`ERROR: ${key} environment variable is required`)
    process.exit(1)
  }
  return value
}

const studentEmail = getRequiredEnv('E2E_STUDENT_EMAIL')
const studentPassword = getRequiredEnv('E2E_STUDENT_PASSWORD')
const staffEmail = getRequiredEnv('E2E_STAFF_EMAIL')
const staffPassword = getRequiredEnv('E2E_STAFF_PASSWORD')

test.describe('WCAG 2.1 AA — Exam Pages', () => {
  test('login page has no accessibility violations', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('student dashboard has no accessibility violations', async ({ page }) => {
    await login(page, studentEmail, studentPassword)
    await page.goto('/student/dashboard')
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('staff exam management has no accessibility violations', async ({ page }) => {
    await login(page, staffEmail, staffPassword)
    await page.goto('/staff/exams/internal')
    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })
})
