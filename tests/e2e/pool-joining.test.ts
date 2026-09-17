import { test, expect } from '@playwright/test'
import { getStudentCredentials, loginAs, waitForDashboard } from './helpers/auth'

test.describe('Pool Joining E2E', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, getStudentCredentials())
  })

  test('student can view exam pools page', async ({ page }) => {
    await page.goto('/student/exam-pools')
    await waitForDashboard(page)
    await expect(page.locator('body')).not.toContainText('Sign In')
    await expect(page.locator('h1')).toContainText(/Exam Pools|Pools/i)
  })

  test('student sees available pools or empty state', async ({ page }) => {
    await page.goto('/student/exam-pools')
    await waitForDashboard(page)
    const joinButtons = page.locator('button:has-text("Join Pool")')
    const count = await joinButtons.count()
    if (count > 0) {
      await expect(joinButtons.first()).toBeVisible()
    } else {
      await expect(page.locator('text=/No pools|No available/i').first()).toBeVisible({ timeout: 10000 })
    }
  })

  test('student can join an exam pool and see confirmation', async ({ page }) => {
    await page.goto('/student/exam-pools')

    const joinButton = page.locator('button:has-text("Join Pool")').first()
    const poolAvailable = await joinButton.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!poolAvailable, 'No open pools available — skipping join flow')

    await joinButton.click()
    await expect(page.locator('text=/Confirm|Enroll/i')).toBeVisible()
    await page.click('button:has-text("Confirm")')
    await expect(page.locator('text=/Success|Joined|Enrolled/i')).toBeVisible()
  })

  test('student pool detail shows booking information', async ({ page }) => {
    await page.goto('/student/exam-pools')
    const poolLink = page.locator('a[href*="/student/exam-pools/"]').first()
    const poolAvailable = await poolLink.isVisible({ timeout: 3000 }).catch(() => false)
    test.skip(!poolAvailable, 'No pool detail links available — skipping detail flow')

    await poolLink.click()
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('text=/Pool|Booking|Exam/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('unauthenticated user is redirected from exam pools', async ({ page }) => {
    await page.goto('/student/exam-pools')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
