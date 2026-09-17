import { test, expect } from '@playwright/test'
import { loginAs, getStudentCredentials } from './helpers/auth'

/**
 * Critical Applicant Flow E2E Tests
 *
 * Covers:
 * 1. Login → Dashboard → Navigation
 * 2. Course catalogue browsing
 * 3. Exam bookings page
 * 4. Aptitude test landing
 */

test.describe('Applicant Portal Critical Flows', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, getStudentCredentials())
  })

  test('dashboard loads and shows status', async ({ page }) => {
    await page.goto('/applicant')
    await expect(page.locator('h1')).toContainText(/Welcome/i)
    await expect(page.locator('body')).toContainText(/Application Status/i)
  })

  test('navigation links are accessible', async ({ page }) => {
    await page.goto('/applicant')
    const links = page.locator('nav a, [href*="/applicant"]')
    const count = await links.count()
    expect(count).toBeGreaterThan(0)
  })

  test('courses page loads', async ({ page }) => {
    await page.goto('/applicant/courses')
    await expect(page.locator('h1')).toContainText(/Course Catalogue|Browse Courses/i)
  })

  test('exam bookings page loads', async ({ page }) => {
    await page.goto('/applicant/exam-bookings')
    await expect(page.locator('h1')).toContainText(/Exam Bookings/i)
  })

  test('aptitude test landing loads', async ({ page }) => {
    await page.goto('/applicant/application/aptitude-test')
    await expect(page.locator('h1')).toContainText(/Aptitude Test/i)
  })

  test('notifications page loads', async ({ page }) => {
    await page.goto('/applicant/notifications')
    await expect(page.locator('h1')).toContainText(/Notifications/i)
  })

  test('profile page loads', async ({ page }) => {
    await page.goto('/applicant/profile')
    await expect(page.locator('h1')).toContainText(/My Profile/i)
  })
})
