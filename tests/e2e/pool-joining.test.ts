import { test, expect } from '@playwright/test'

test.describe('Pool Joining E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login as a student
    await page.goto('/login')
    await page.fill('#email', 'student@aerojet-academy.com')
    await page.fill('#password', 'REDACTED_PASSWORD')
    await page.click('button[type="submit"]')
    // Use waitForURL with a generous timeout — LoginForm uses window.location.href
    // We don't use waitForURL because Next.js dev server cold-compilation
    // often fails to fire a traditional 'load' or 'commit' event properly.
    // Instead we just poll for the portal UI to render.
    await expect(page.locator('body')).toContainText(/Dashboard|Welcome/i, { timeout: 30000 })
  })

  test('student can view and join an exam pool', async ({ page }) => {
    // 1. Navigate to exam pooling (actual route in student portal)
    await page.goto('/student/exam-pools')

    // 2. Verify page is accessible (not redirected to login)
    await expect(page.locator('body')).not.toContainText('Sign In')

    // 3. Find an open pool join button
    const joinButton = page.locator('button:has-text("Join Pool")').first()

    // If there's an open pool, test the join flow
    if (await joinButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await joinButton.click()

      // 4. Verify modal/confirmation dialog appears
      await expect(page.locator('text=/Confirm|Enroll/i')).toBeVisible()
      await page.click('button:has-text("Confirm")')

      // 5. Verify success message
      await expect(page.locator('text=/Success|Joined|Enrolled/i')).toBeVisible()
    } else {
      console.log('No open pools available for testing — skipping join flow')
    }
  })
})
