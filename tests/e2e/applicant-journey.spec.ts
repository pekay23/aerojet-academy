import { test, expect } from '@playwright/test'
import { loginAsApplicant, getApplicantCredentials } from './helpers/auth'

test.describe('Applicant Critical Journey', () => {
  test('registration page loads with form fields', async ({ page }) => {
    await page.goto('/register')
    await expect(page.locator('h1, h2').first()).toBeVisible()
    await expect(page.locator('body')).toContainText(/Register|Create|Account|Admission/i)
    await expect(page.locator('#firstName')).toBeVisible()
    await expect(page.locator('#lastName')).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.locator('#confirmPassword')).toBeVisible()
  })

  test('registration form submits successfully with valid data', async ({ page }) => {
    await page.goto('/register')
    const uniqueEmail = `test.applicant.${Date.now()}@example.com`

    await page.fill('#firstName', 'Playwright')
    await page.fill('#lastName', 'Applicant')
    await page.fill('#email', uniqueEmail)
    await page.fill('#dateOfBirth', '1995-06-15')
    await page.fill('#phone', '5551234567')
    await page.selectOption('select:has-text("Select Nationality")', 'Ghanaian')
    await page.selectOption('select:has-text("Select a study pathway")', 'EXAM_ONLY')
    await page.check('input[type="checkbox"]')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=/Success|Account created|Check your email/i')).toBeVisible({ timeout: 15000 })
  })

  test('registration form rejects empty required fields', async ({ page }) => {
    await page.goto('/register')
    await page.click('button[type="submit"]')

    await expect(page.locator('text=/First Name is required|Last Name is required|Email is required|Please correct/i')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('#email')).toHaveAttribute('aria-invalid', 'true')
  })

  test('applicant can sign in and reach the dashboard', async ({ page }) => {
    await loginAsApplicant(page)
    await page.goto('/applicant')
    await expect(page.locator('h1')).toContainText(/Welcome/i)
    await expect(page.locator('body')).toContainText(/Application Status/i)
  })

  test('applicant dashboard shows user email', async ({ page }) => {
    const creds = getApplicantCredentials()
    await loginAsApplicant(page)
    await expect(page.locator('body')).toContainText(new RegExp(creds.email.replace('@', '@'), 'i'), { timeout: 15000 })
  })

  test('payment upload step is reachable with bank details', async ({ page }) => {
    await loginAsApplicant(page)
    await page.goto('/applicant/application/payment')
    await expect(page.locator('h1, h2').first()).toBeVisible()
    await expect(page.locator('body')).toContainText(/Payment|Upload|Registration Fee/i)
    await expect(page.locator('text=/Bank|Account|Swift/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('pathway selection step is reachable with programme list', async ({ page }) => {
    await loginAsApplicant(page)
    await page.goto('/applicant/pathway')
    await expect(page.locator('h1, h2').first()).toBeVisible()
    await expect(page.locator('body')).toContainText(/Pathway|Enrollment|Programme/i)
    await expect(page.locator('text=/Examination Only|EASA Part-66/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('exam booking flow exposes packages and pools', async ({ page }) => {
    await loginAsApplicant(page)
    await page.goto('/applicant/exam-only')
    await expect(page.locator('h1')).toContainText(/Exam Only Pathway/i)
    await expect(page.locator('body')).toContainText(/Exam Packages|Exam Bookings/i)
  })

  test('exam booking detail view renders for a valid pool', async ({ page }) => {
    await loginAsApplicant(page)
    await page.goto('/applicant/exam-bookings')
    await expect(page.locator('h1')).toContainText(/Exam Bookings/i)
    const firstPool = page.locator('a[href*="/applicant/exam-bookings/"]').first()
    if (await firstPool.count()) {
      await firstPool.click()
      await expect(page.locator('h1')).toBeVisible()
    }
  })

  test('course catalogue -> course detail navigation', async ({ page }) => {
    await loginAsApplicant(page)
    await page.goto('/applicant/courses')
    await expect(page.locator('h1')).toContainText(/Course Catalogue|Browse Courses/i)
    const firstCourse = page.locator('a[href*="/applicant/courses/"]').first()
    if (await firstCourse.count()) {
      await firstCourse.click()
      await expect(page.locator('h1')).toBeVisible()
    }
  })
})
