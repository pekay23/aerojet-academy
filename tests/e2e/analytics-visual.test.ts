import { test, expect } from '@playwright/test'
import { loginAs, getAdminCredentials } from './helpers/auth'

test.describe('Analytics Dashboard — Visual Verification', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, getAdminCredentials())
  })

  test('overview tab loads and renders correctly', async ({ page }) => {
    await page.goto('/staff/analytics')
    await expect(page.locator('h1')).toContainText('Analytics')

    // Wait for metrics to load
    await expect(page.locator('text=Total Revenue')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Total Students')).toBeVisible()
    await expect(page.locator('text=Active Enrollments')).toBeVisible()

    // Screenshot for visual verification
    await page.screenshot({ path: 'tests/e2e/screenshots/analytics-overview.png', fullPage: true })
  })

  test('funnels tab renders chart', async ({ page }) => {
    await page.goto('/staff/analytics?tab=funnels')
    await expect(page.locator('text=Funnel Analysis')).toBeVisible({ timeout: 10000 })

    // Verify funnel dropdown exists
    await expect(page.locator('text=Registration')).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/analytics-funnels.png', fullPage: true })
  })

  test('retention tab renders cohort data', async ({ page }) => {
    await page.goto('/staff/analytics?tab=retention')
    await expect(page.locator('text=Cohort Retention')).toBeVisible({ timeout: 10000 })

    await page.screenshot({ path: 'tests/e2e/screenshots/analytics-retention.png', fullPage: true })
  })

  test('features tab shows adoption metrics', async ({ page }) => {
    await page.goto('/staff/analytics?tab=features')
    await expect(page.locator('text=Feature Adoption')).toBeVisible({ timeout: 10000 })

    // Check for feature buttons
    await expect(page.locator('text=registration')).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/analytics-features.png', fullPage: true })
  })

  test('pageviews tab shows top pages table', async ({ page }) => {
    await page.goto('/staff/analytics?tab=pageviews')
    await expect(page.locator('text=Page Views')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Top Pages')).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/analytics-pageviews.png', fullPage: true })
  })

  test('user journey tab renders input', async ({ page }) => {
    await page.goto('/staff/analytics?tab=journey')
    await expect(page.locator('text=User Journey')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('input[placeholder="Enter user ID"]')).toBeVisible()

    await page.screenshot({ path: 'tests/e2e/screenshots/analytics-journey.png', fullPage: true })
  })

  test('navigation between tabs works', async ({ page }) => {
    await page.goto('/staff/analytics')

    // Click on each tab and verify content
    const tabs = ['funnels', 'retention', 'features', 'pageviews', 'journey']
    for (const tab of tabs) {
      await page.click(`[data-value="${tab}"]`)
      await expect(page.locator('text=Analytics')).toBeVisible()
    }

    await page.screenshot({ path: 'tests/e2e/screenshots/analytics-all-tabs.png', fullPage: true })
  })
})
