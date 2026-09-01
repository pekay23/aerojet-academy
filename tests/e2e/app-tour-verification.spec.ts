/**
 * AppTour Browser Verification
 *
 * Login: Direct CSRF → credentials callback POST (bypasses JS signIn race)
 * Tour: Capture before-tour (before 1.5s auto-start), then step through Joyride
 */
import { test, expect, Page } from '@playwright/test'
import {
  getStaffCredentials,
  getStudentCredentials,
  getInstructorCredentials,
  getApplicantCredentials,
  getExaminerCredentials,
} from './helpers/auth'

const SCREENSHOT_DIR = 'tests/e2e/tour-screenshots'

// react-joyride v3.2.0 selectors:
// - Tooltip container: className="react-joyride__tooltip"
// - Buttons use data-testid (NOT CSS classes — buttons are inline-styled)
const JOYRIDE_TOOLTIP = '.react-joyride__tooltip'
const JOYRIDE_PRIMARY_BTN = '[data-testid="button-primary"]'
const JOYRIDE_SKIP_BTN = '[data-testid="button-skip"]'
const JOYRIDE_BACK_BTN = '[data-testid="button-back"]'

interface PortalConfig {
  role: string
  email: string
  password: string
  dashboardUrl: string
  expectsPath: string
}

const PORTALS: PortalConfig[] = [
  { role: 'Staff', email: 'staff@aerojet-academy.com', password: 'REDACTED_PASSWORD', dashboardUrl: '/staff/dashboard', expectsPath: '/staff' },
  { role: 'Student', email: 'student@aerojet-academy.com', password: 'REDACTED_PASSWORD', dashboardUrl: '/student', expectsPath: '/student' },
  { role: 'Instructor', email: 'instructor@aerojet-academy.com', password: 'REDACTED_PASSWORD', dashboardUrl: '/instructor/dashboard', expectsPath: '/instructor' },
  { role: 'Applicant', email: 'applicant@example.com', password: 'REDACTED_PASSWORD', dashboardUrl: '/applicant', expectsPath: '/applicant' },
  { role: 'Examiner', email: 'examiner@aerojet-academy.com', password: 'REDACTED_PASSWORD', dashboardUrl: '/examiner', expectsPath: '/examiner' },
]

/**
 * Login via direct CSRF → credentials callback POST.
 * Bypasses the async signIn/startTransition flow that's unstable in tests.
 */
async function loginViaApi(page: Page, portal: PortalConfig) {
  const log = (msg: string) => console.log(`[${portal.role}] ${msg}`)

  await page.goto('/login', { waitUntil: 'domcontentloaded' })

  log('Fetching CSRF token...')
  const csrfResp = await page.request.get('/api/auth/csrf')
  const csrfData = await csrfResp.json()
  const csrfToken = csrfData.csrfToken

  if (!csrfToken) throw new Error(`[${portal.role}] Failed to obtain CSRF token`)
  log('  CSRF token obtained')

  log('Posting credentials...')
  const body = new URLSearchParams({
    csrfToken,
    email: portal.email,
    password: portal.password,
    redirect: 'false',
  }).toString()

  let response
  let attempt = 0
  while (attempt < 3) {
    try {
      response = await page.request.post('/api/auth/callback/credentials', {
        data: body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      break
    } catch (e: any) {
      attempt++
      log(`  POST attempt ${attempt} failed: ${e.message?.substring(0, 80)}`)
      if (attempt >= 3) throw e
      await page.goto('/login', { waitUntil: 'domcontentloaded' })
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  const cookies = await page.context().cookies()
  const sessionCookie = cookies.find(
    (c) => c.name === 'next-auth.session-token' || c.name === '__Secure-next-auth.session-token',
  )
  if (!sessionCookie) {
    throw new Error(`[${portal.role}] No session cookie after credentials POST`)
  }
  log('  Session cookie set successfully')
}

/**
 * Navigate to dashboard and wait for page to load (but NOT for tour auto-start).
 * The tour auto-starts 1.5s after AppTour mounts — we capture before-tour
 * before that timer fires.
 */
async function navigateToDashboard(page: Page, portal: PortalConfig) {
  const log = (msg: string) => console.log(`[${portal.role}] ${msg}`)

  log(`Navigating to ${portal.dashboardUrl}...`)
  await page.goto(portal.dashboardUrl, { waitUntil: 'domcontentloaded' })

  // Wait for main content / sidebar to render (confirms page loaded)
  // Do NOT wait long — the tour auto-starts at 1.5s and we want to capture before-tour
  const mainContent = page.locator('#main-content, main, [class*="main-content"]')
  await expect(mainContent.first()).toBeVisible({ timeout: 15000 })

  // Verify URL is correct (not redirected to login)
  const url = page.url()
  if (!url.includes(portal.expectsPath)) {
    throw new Error(`[${portal.role}] Login failed - on ${url}`)
  }
  log(`Dashboard loaded, on: ${url}`)
}

/**
 * Start the tour if not already running, then step through and capture.
 */
async function captureTourScreenshots(page: Page, portalName: string) {
  // The tour auto-starts 1.5s after mount. By now, it should be running.
  // If not, try the trigger button or dispatch event.
  let tourVisible = false

  try {
    await page.waitForSelector(JOYRIDE_TOOLTIP, { state: 'visible', timeout: 8000 })
    tourVisible = true
    console.log(`[${portalName}] Tour auto-started!`)
  } catch {
    console.log(`[${portalName}] Tour did not auto-start, trying trigger...`)
  }

  if (!tourVisible) {
    // Try clicking the trigger button
    const trigger = page.locator('[data-tour-id="topbar-tour-trigger"]')
    const count = await trigger.count()
    if (count > 0) {
      await trigger.scrollIntoViewIfNeeded().catch(() => {})
      await trigger
        .click({ position: { x: 16, y: 16 } })
        .catch(async (e) => {
          console.log(`[${portalName}] Click failed (overlay?), trying JS click`)
          await trigger.evaluate((el: HTMLElement) => el.click())
        })
      console.log(`[${portalName}] Clicked tour trigger`)
      await page.waitForSelector(JOYRIDE_TOOLTIP, { state: 'visible', timeout: 8000 })
      tourVisible = true
    } else {
      console.log(`[${portalName}] No trigger button, dispatching event...`)
      await page.evaluate(() => window.dispatchEvent(new CustomEvent('start-app-tour')))
      await page.waitForTimeout(3000)
      tourVisible = (await page.locator(JOYRIDE_TOOLTIP).count()) > 0
    }
  }

  if (!tourVisible) {
    console.log(`[${portalName}] Tour never appeared`)
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${portalName}-02-no-tour.png`,
      fullPage: true,
    })
    return
  }

  // Capture first step
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${portalName}-02-first-step.png`,
    fullPage: true,
  })

  // Navigate through tour steps using Joyride's own buttons.
  // Joyride unmounts the tooltip during step transitions, so we detect the
  // end of the tour by the disappearance of the primary (Next/Finish) button.
  let tourStep = 3
  let safety = 0

  while (safety < 25) {
    safety++

    const primaryBtn = page.locator(JOYRIDE_PRIMARY_BTN)
    const primaryCount = await primaryBtn.count()

    if (primaryCount === 0) {
      // No primary button — check for skip
      const skipBtn = page.locator(JOYRIDE_SKIP_BTN)
      if ((await skipBtn.count()) > 0) {
        await page.screenshot({
          path: `${SCREENSHOT_DIR}/${portalName}-${String(tourStep).padStart(2, '0')}-skip-available.png`,
          fullPage: true,
        })
        await skipBtn.click()
        break
      }
      // No buttons at all — tour has ended
      break
    }

    const btnText = await primaryBtn.first().textContent().catch(() => '')
    const isFinish = btnText?.toLowerCase().includes('finish') ?? false

    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${portalName}-${String(tourStep).padStart(2, '0')}-step-${isFinish ? 'finish' : 'next'}.png`,
      fullPage: true,
    })

    console.log(`[${portalName}] Step ${tourStep}: button="${btnText?.trim()}", finish=${isFinish}`)

    if (isFinish) {
      await primaryBtn.first().click()
      await page.waitForTimeout(1000)
      break
    }

    await primaryBtn.first().click()
    // Wait for the next step's primary button to appear (Joyride transitions)
    try {
      await page.waitForSelector(JOYRIDE_PRIMARY_BTN, { state: 'visible', timeout: 5000 })
    } catch {
      // No next step button — tour ended
      break
    }
    tourStep++
  }

  // Final: after tour
  await page.waitForTimeout(500)
  await page.screenshot({
    path: `${SCREENSHOT_DIR}/${portalName}-${String(tourStep).padStart(2, '0')}-after-tour.png`,
    fullPage: true,
  })
  console.log(`[${portalName}] Completed ${tourStep} screenshots`)
}

test.describe('AppTour Visual Verification', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
  })

  for (const portal of PORTALS) {
    test(`${portal.role} portal - tour starts and navigates`, async ({ page }) => {
      await loginViaApi(page, portal)
      await navigateToDashboard(page, portal)

      // Capture before-tour screenshot immediately (tour auto-starts at 1.5s)
      // Page is loaded but tour hasn't started yet
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${portal.role.toLowerCase()}-01-before-tour.png`,
        fullPage: true,
      })

      // Now capture tour steps (tour may have auto-started during this call)
      await captureTourScreenshots(page, portal.role.toLowerCase())
    })
  }
})
