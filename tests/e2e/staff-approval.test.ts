import { test, expect } from '@playwright/test'

// Helper to log in as a specific user
async function loginAs(page: any, email: string, password: string) {
  await page.goto('/login')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
}

test.describe('Staff Portal E2E', () => {
  test('staff can login and reach dashboard', async ({ page }) => {
    await loginAs(page, 'staff@aerojet-academy.com', 'REDACTED_PASSWORD')

    // Wait for staff layout to render by polling an element
    await expect(page.locator('nav, [role="navigation"], aside').first()).toBeVisible({
      timeout: 30000,
    })
    expect(page.url()).toContain('/staff')
  })

  test('admin can login and reach dashboard', async ({ page }) => {
    await loginAs(page, 'admin@aerojet-academy.com', 'REDACTED_PASSWORD')

    await expect(page.locator('nav, [role="navigation"], aside').first()).toBeVisible({
      timeout: 30000,
    })
    expect(page.url()).toContain('/staff')
  })

  test('staff can navigate to newsroom', async ({ page }) => {
    await loginAs(page, 'staff@aerojet-academy.com', 'REDACTED_PASSWORD')
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
    await loginAs(page, 'staff@aerojet-academy.com', 'REDACTED_PASSWORD')
    await expect(page.locator('nav, [role="navigation"], aside').first()).toBeVisible({
      timeout: 30000,
    })

    await page.goto('/staff/applicants')
    expect(page.url()).toContain('/staff/users?tab=applicants')
    await expect(page.locator('body')).not.toContainText('Sign In')
  })

  test('login fails with wrong password', async ({ page }) => {
    await loginAs(page, 'staff@aerojet-academy.com', 'WrongPassword')

    // Should stay on login page with an error message
    await expect(page.locator('body')).toContainText(/Invalid email or password/i, {
      timeout: 5000,
    })
    expect(page.url()).toContain('/login')
  })
})
