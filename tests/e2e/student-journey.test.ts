import { test, expect } from '@playwright/test'
import { loginAsStudent, getStudentCredentials, waitForDashboard } from './helpers/auth'

test.describe('Student Journey E2E', () => {
  test('applicant can register and login', async ({ page }) => {
    await page.goto('/')

    await page.click('text=/Get Started|Join Now|Apply/i')
    await expect(page).toHaveURL(/\/register/)

    const uniqueEmail = `test.student.${Date.now()}@example.com`
    await page.fill('#firstName', 'Test')
    await page.fill('#lastName', 'Student')
    await page.fill('#email', uniqueEmail)
    await page.fill('#password', 'REDACTED_PASSWORD')
    await page.fill('#confirmPassword', 'REDACTED_PASSWORD')

    await page.click('button[type="submit"]')
    await expect(page.locator('text=/Success|Account created|Check your email/i')).toBeVisible()

    const _creds = getStudentCredentials()
    await loginAsStudent(page)
    await expect(page.locator('body')).toContainText(/Dashboard|Welcome/i, { timeout: 30000 })
  })

  test('student login with seeded credentials reaches dashboard', async ({ page }) => {
    await loginAsStudent(page)
    await expect(page.url()).toContain('/student')
    await expect(page.locator('body')).toContainText(/Dashboard|Welcome/i, { timeout: 15000 })
  })

  test('student grades page renders table data', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/student/grades')
    await waitForDashboard(page, 'My Grades')
    await expect(page.locator('h1')).toContainText(/My Grades/i)
    await expect(page.locator('text=/Average Score|Assessments|Modules Completed/i').first()).toBeVisible({ timeout: 15000 })
    await expect(page.locator('table, [class*="rounded-2xl"]').first()).toBeVisible({ timeout: 15000 })
  })

  test('student grades page shows academic records or empty state', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/student/grades')
    await waitForDashboard(page, 'My Grades')
    const hasGrades = page.locator('table tbody tr')
    const count = await hasGrades.count()
    if (count > 0) {
      await expect(hasGrades.first()).toContainText(/Pass|Fail|A|B|C|F/)
    } else {
      await expect(page.locator('text=/No grades found|Grades will appear/i')).toBeVisible()
    }
  })

  test('student courses page renders course list', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/student/courses')
    await waitForDashboard(page, 'My Courses')
    await expect(page.locator('h1')).toContainText(/My Courses/i)
    await expect(page.locator('text=/Manage your active|Browse Course/i').first()).toBeVisible({ timeout: 15000 })
  })

  test('student courses page shows enrollments or empty state', async ({ page }) => {
    await loginAsStudent(page)
    await page.goto('/student/courses')
    await waitForDashboard(page, 'My Courses')
    const hasCourses = page.locator('a[href*="/student/courses/"]')
    const count = await hasCourses.count()
    if (count > 0) {
      await expect(hasCourses.first()).toBeVisible()
    } else {
      await expect(page.locator('text=/Not enrolled in any courses/i')).toBeVisible()
    }
  })

  test('unauthenticated user is redirected from student grades', async ({ page }) => {
    await page.goto('/student/grades')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })

  test('unauthenticated user is redirected from student courses', async ({ page }) => {
    await page.goto('/student/courses')
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 })
  })
})
