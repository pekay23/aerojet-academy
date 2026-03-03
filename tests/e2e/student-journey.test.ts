import { test, expect } from '@playwright/test'

test.describe('Student Journey E2E', () => {
  test('applicant can register and login', async ({ page }) => {
    // 1. Navigate to landing page
    await page.goto('/')

    // 2. Click "Get Started" or "Register"
    await page.click('text=/Get Started|Join Now|Apply/i')

    // 3. Verify on registration page
    await expect(page).toHaveURL(/\/register/)

    // 4. Fill registration form
    await page.fill('#firstName', 'Test')
    await page.fill('#lastName', 'Student')
    await page.fill('#email', `test.${Date.now()}@example.com`)
    await page.fill('#password', 'REDACTED_PASSWORD')
    await page.fill('#confirmPassword', 'REDACTED_PASSWORD')

    // 5. Submit
    await page.click('button[type="submit"]')

    // 6. Verify success message or redirect to login
    await expect(page.locator('text=/Success|Account created|Check your email/i')).toBeVisible()

    // 7. Try to login with seeded student (reliable — does not depend on email verification)
    await page.goto('/login')
    await page.fill('#email', 'student@aerojet-academy.com')
    await page.fill('#password', 'REDACTED_PASSWORD')
    await page.click('button[type="submit"]')

    // 8. Verify dashboard — poll for UI instead of waitForURL to handle cold-compilations
    await expect(page.locator('body')).toContainText(/Dashboard|Welcome/i, { timeout: 30000 })
  })
})
