import { Page } from '@playwright/test'

// Test credentials - these should match seeded test users
const TEST_USERS = {
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'admin@test.aerojet.academy',
    password: process.env.E2E_ADMIN_PASSWORD || 'AdminTest123!',
  },
  staff: {
    email: process.env.E2E_STAFF_EMAIL || 'staff@test.aerojet.academy',
    password: process.env.E2E_STAFF_PASSWORD || 'StaffTest123!',
  },
  student: {
    email: process.env.E2E_STUDENT_EMAIL || 'student@test.aerojet.academy',
    password: process.env.E2E_STUDENT_PASSWORD || 'StudentTest123!',
  },
  instructor: {
    email: process.env.E2E_INSTRUCTOR_EMAIL || 'instructor@test.aerojet.academy',
    password: process.env.E2E_INSTRUCTOR_PASSWORD || 'InstructorTest123!',
  },
  applicant: {
    email: process.env.E2E_APPLICANT_EMAIL || 'applicant@test.aerojet.academy',
    password: process.env.E2E_APPLICANT_PASSWORD || 'ApplicantTest123!',
  },
}

export function getAdminCredentials() {
  return TEST_USERS.admin
}

export function getStaffCredentials() {
  return TEST_USERS.staff
}

export function getStudentCredentials() {
  return TEST_USERS.student
}

export function getInstructorCredentials() {
  return TEST_USERS.instructor
}

export function getApplicantCredentials() {
  return TEST_USERS.applicant
}

export async function loginAs(page: Page, credentials: { email: string; password: string }) {
  await page.goto('/login')
  await page.waitForLoadState('domcontentloaded')

  await page.fill('#email', credentials.email)
  await page.fill('#password', credentials.password)
  await page.click('button[type="submit"]')

  // Wait for redirect after login
  await page.waitForURL(/\/dashboard|\/staff|\/student|\/instructor|\/applicant/, {
    timeout: 15000,
  })
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

export async function waitForDashboard(page: Page, expectedHeading?: string) {
  // Wait for navigation/sidebar to appear
  await page.waitForSelector('nav, [role="navigation"], aside', { timeout: 10000 })

  // Optionally wait for specific heading
  if (expectedHeading) {
    await page.waitForSelector(
      `h1:has-text("${expectedHeading}"), h2:has-text("${expectedHeading}")`,
      {
        timeout: 10000,
      }
    )
  }
}

export async function logout(page: Page) {
  // Try to find and click logout button
  const logoutButton = page
    .locator('button:has-text("Logout"), a:has-text("Logout"), [data-testid="logout"]')
    .first()
  if (await logoutButton.isVisible({ timeout: 2000 })) {
    await logoutButton.click()
    await page.waitForURL('/login', { timeout: 5000 })
  }
}
