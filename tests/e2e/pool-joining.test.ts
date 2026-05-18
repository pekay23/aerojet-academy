import { test, expect } from '@playwright/test'
import { getStudentCredentials, loginAs } from './helpers/auth'

test.describe('Pool Joining E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, getStudentCredentials())
  })

  test('student can view and join an exam pool', async ({ page }) => {
    // 1. Navigate to exam pooling
    await page.goto('/student/exam-pools')

    // 2. Verify page is accessible (not redirected to login)
    await expect(page.locator('body')).not.toContainText('Sign In')

    // 3. Find an open pool join button
    const joinButton = page.locator('button:has-text("Join Pool")').first()

    const poolAvailable = await joinButton.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!poolAvailable, 'No open pools available — skipping join flow')

    await joinButton.click()

    // 4. Verify modal/confirmation dialog appears
    await expect(page.locator('text=/Confirm|Enroll/i')).toBeVisible()
    await page.click('button:has-text("Confirm")')

    // 5. Verify success message
    await expect(page.locator('text=/Success|Joined|Enrolled/i')).toBeVisible()
  })
})
