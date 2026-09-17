import { Page, expect } from '@playwright/test'

interface TestCredentials {
  email: string
  password: string
}

let fallbackWarningShown = false

function getEnvCreds(
  emailEnv: string | undefined,
  passwordEnv: string | undefined,
  fallbackEmail: string,
  fallbackPassword: string
): TestCredentials {
  const email = emailEnv || fallbackEmail
  const password = passwordEnv || fallbackPassword

  if (!emailEnv || !passwordEnv) {
    if (!fallbackWarningShown) {
      console.warn(
        '[e2e/auth] Using fallback test credentials. Set E2E_*_EMAIL / E2E_*_PASSWORD env vars for production runs.'
      )
      fallbackWarningShown = true
    }
  }

  return { email, password }
}

export function getStudentCredentials(): TestCredentials {
  return getEnvCreds(
    process.env.E2E_STUDENT_EMAIL,
    process.env.E2E_STUDENT_PASSWORD,
    'student@aerojet-academy.com',
    'Student@2026'
  )
}

export function getStaffCredentials(): TestCredentials {
  return getEnvCreds(
    process.env.E2E_STAFF_EMAIL,
    process.env.E2E_STAFF_PASSWORD,
    'staff@aerojet-academy.com',
    'Staff@2026'
  )
}

export function getAdminCredentials(): TestCredentials {
  return getEnvCreds(
    process.env.E2E_ADMIN_EMAIL,
    process.env.E2E_ADMIN_PASSWORD,
    'admin@aerojet-academy.com',
    'Admin@2026'
  )
}

export function getInstructorCredentials(): TestCredentials {
  return getEnvCreds(
    process.env.E2E_INSTRUCTOR_EMAIL,
    process.env.E2E_INSTRUCTOR_PASSWORD,
    'instructor@aerojet-academy.com',
    'Instructor@2026'
  )
}

export function getApplicantCredentials(): TestCredentials {
  return getEnvCreds(
    process.env.E2E_APPLICANT_EMAIL,
    process.env.E2E_APPLICANT_PASSWORD,
    'applicant@aerojet-academy.com',
    'Applicant@2026'
  )
}

export function getExaminerCredentials(): TestCredentials {
  return getEnvCreds(
    process.env.E2E_EXAMINER_EMAIL,
    process.env.E2E_EXAMINER_PASSWORD,
    'examiner@aerojet-academy.com',
    'Examiner@2026'
  )
}

export async function loginAs(page: Page, creds: TestCredentials) {
  await page.goto('/login')
  await page.fill('#email', creds.email)
  await page.fill('#password', creds.password)
  await page.click('button[type="submit"]')
  await expect(page.locator('body')).toContainText(/Dashboard|Welcome/i, { timeout: 30000 })
}

export async function loginAsStudent(page: Page) {
  await loginAs(page, getStudentCredentials())
}

export async function loginAsStaff(page: Page) {
  await loginAs(page, getStaffCredentials())
}

export async function loginAsAdmin(page: Page) {
  await loginAs(page, getAdminCredentials())
}

export async function loginAsInstructor(page: Page) {
  await loginAs(page, getInstructorCredentials())
}

export async function loginAsApplicant(page: Page) {
  await loginAs(page, getApplicantCredentials())
}

export async function loginAsExaminer(page: Page) {
  await loginAs(page, getExaminerCredentials())
}

export async function waitForDashboard(page: Page, expectedText?: string) {
  const matcher = expectedText ? new RegExp(expectedText, 'i') : /Dashboard|Welcome/i
  await expect(page.locator('body')).toContainText(matcher, { timeout: 30000 })
  await expect(page.locator('nav, [role="navigation"], aside').first()).toBeVisible({
    timeout: 15000,
  })
}
