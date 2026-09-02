import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('WCAG 2.1 AA — Exam Pages', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('login page has no accessibility violations', async ({ page }) => {
    await page.fill('#email', 'test@example.com')
    await page.fill('#password', 'password123')
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('student dashboard has no accessibility violations', async ({ page }) => {
    await page.goto('/student/dashboard')
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('staff exam management has no accessibility violations', async ({ page }) => {
    await page.goto('/staff/exams/internal')
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze()
    expect(accessibilityScanResults.violations).toEqual([])
  })
})
