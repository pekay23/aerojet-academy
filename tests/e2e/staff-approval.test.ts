import { test, expect } from '@playwright/test'
import { getStaffCredentials, getAdminCredentials, loginAs, waitForDashboard } from './helpers/auth'

test.describe('Staff Portal E2E', () => {
  test('staff can login and reach dashboard', async ({ page }) => {
    await loginAs(page, getStaffCredentials())
    await expect(page.locator('nav, [role="navigation"], aside').first()).toBeVisible({ timeout: 30000 })
    expect(page.url()).toContain('/staff')
    await expect(page.locator('body')).toContainText(/Dashboard|Welcome/i)
  })

  test('admin can login and reach dashboard', async ({ page }) => {
    await loginAs(page, getAdminCredentials())
    await expect(page.locator('nav, [role="navigation"], aside').first()).toBeVisible({ timeout: 30000 })
    expect(page.url()).toContain('/staff')
    await expect(page.locator('body')).toContainText(/Dashboard|Welcome/i)
  })

  test('staff dashboard shows navigation and user menu', async ({ page }) => {
    await loginAs(page, getStaffCredentials())
    await waitForDashboard(page)
    await expect(page.locator('nav, [role="navigation"], aside').first()).toBeVisible()
    await expect(page.locator('text=/Dashboard|People|Settings/i').first()).toBeVisible({ timeout: 10000 })
  })

  test('staff can navigate to newsroom and see content', async ({ page }) => {
    await loginAs(page, getStaffCredentials())
    await waitForDashboard(page)

    await page.goto('/staff/newsroom')
    expect(page.url()).toContain('/newsroom')
    await expect(page.locator('body')).not.toContainText('Sign In')
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 })
  })

  test('staff can navigate to applicants page and see queue', async ({ page }) => {
    await loginAs(page, getStaffCredentials())
    await waitForDashboard(page)

    await page.goto('/staff/users?tab=applicants')
    expect(page.url()).toContain('/staff/users')
    await expect(page.locator('body')).not.toContainText('Sign In')
    await expect(page.locator('text=/Applicants|People/i').first()).toBeVisible({ timeout: 15000 })
  })

  test('staff applicants page shows applicant counts', async ({ page }) => {
    await loginAs(page, getStaffCredentials())
    await page.goto('/staff/users?tab=applicants')
    await expect(page.locator('body')).not.toContainText('Sign In')
    await expect(page.locator('text=/Pending|Verified|All/i').first()).toBeVisible({ timeout: 15000 })
  })

  test('staff can navigate to students tab', async ({ page }) => {
    await loginAs(page, getStaffCredentials())
    await waitForDashboard(page)
    await page.goto('/staff/users?tab=students')
    expect(page.url()).toContain('/staff/users')
    await expect(page.locator('body')).not.toContainText('Sign In')
    await expect(page.locator('text=/Students/i').first()).toBeVisible({ timeout: 15000 })
  })

  test('login fails with wrong password', async ({ page }) => {
    const creds = getStaffCredentials()
    await page.goto('/login')
    await page.fill('#email', creds.email)
    await page.fill('#password', 'WrongPassword')
    await page.click('button[type="submit"]')

    await expect(page.locator('body')).toContainText(/Invalid email or password/i, { timeout: 5000 })
    expect(page.url()).toContain('/login')
  })

  test('login fails with empty credentials', async ({ page }) => {
    await page.goto('/login')
    await page.click('button[type="submit"]')
    await expect(page.locator('body')).toContainText(/Invalid email or password/i, { timeout: 5000 })
  })
})
