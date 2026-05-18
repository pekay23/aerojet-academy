import { test, expect } from '@playwright/test'
import { getStaffCredentials, getAdminCredentials, loginAs } from './helpers/auth'

test.describe('Staff Portal E2E', () => {
  test('staff can login and reach dashboard', async ({ page }) => {
    await loginAs(page, getStaffCredentials())

    // Wait for staff layout to render by polling an element
    await expect(page.locator('nav, [role="navigation"], aside').first()).toBeVisible({
      timeout: 30000,
    })
    expect(page.url()).toContain('/staff')
  })

  test('admin can login and reach dashboard', async ({ page }) => {
    await loginAs(page, getAdminCredentials())

    await expect(page.locator('nav, [role="navigation"], aside').first()).toBeVisible({
      timeout: 30000,
    })
    expect(page.url()).toContain('/staff')
  })

  test('staff can navigate to newsroom', async ({ page }) => {
    await loginAs(page, getStaffCredentials())
    await expect(page.locator('nav, [role="navigation"], aside').first()).toBeVisible({
      timeout: 30000,
    })

    await page.goto('/staff/newsroom')
    // Verify we are on the newsroom page and not redirected to login
    expect(page.url()).toContain('/newsroom')
    // The newsroom page should have some content (table or empty state)
    await expect(page.locator('body')).not.toContainText('Sign In')
  })

  test('staff can navigate to applicants page', async ({ page }) => {
    await loginAs(page, getStaffCredentials())
    await expect(page.locator('nav, [role="navigation"], aside').first()).toBeVisible({
      timeout: 30000,
    })

    await page.goto('/staff/applicants')
    expect(page.url()).toContain('/staff/users?tab=applicants')
    await expect(page.locator('body')).not.toContainText('Sign In')
  })

  test('login fails with wrong password', async ({ page }) => {
    const creds = getStaffCredentials()
    await page.goto('/login')
    await page.fill('#email', creds.email)
    await page.fill('#password', 'WrongPassword')
    await page.click('button[type="submit"]')

    // Should stay on login page with an error message
    await expect(page.locator('body')).toContainText(/Invalid email or password/i, {
      timeout: 5000,
    })
    expect(page.url()).toContain('/login')
  })
})
