/**
 * Standalone AppTour verification script
 * Uses Playwright directly (not the test framework) to log in, start the tour,
 * and capture screenshots across all 5 portals.
 */
import { chromium, FullPageScreenshotOptions } from 'playwright'
import fs from 'fs'
import path from 'path'

const SCREENSHOT_DIR = path.join(process.cwd(), 'tests', 'e2e', 'tour-screenshots')

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
}

const BASE_URL = 'http://localhost:3000'

const CREDENTIALS = {
  staff: { email: 'staff@aerojet-academy.com', password: 'Staff@2026' },
  student: { email: 'student@aerojet-academy.com', password: 'Student@2026' },
  instructor: { email: 'instructor@aerojet-academy.com', password: 'Instructor@2026' },
  applicant: { email: 'applicant@example.com', password: 'Applicant@2026' },
  examiner: { email: 'examiner@aerojet-academy.com', password: 'Examiner@2026' },
}

const PORTAL_URLS = {
  staff: '/staff/dashboard',
  student: '/student',
  instructor: '/instructor/dashboard',
  applicant: '/applicant',
  examiner: '/examiner',
}

async function loginAs(page: any, role: string) {
  const creds = CREDENTIALS[role as keyof typeof CREDENTIALS]
  console.log(`[${role}] Navigating to login page...`)
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })

  console.log(`[${role}] Filling credentials...`)
  await page.fill('#email', creds.email)
  await page.fill('#password', creds.password)
  await page.click('button[type="submit"]')

  // Wait for redirect to portal
  const portalUrl = PORTAL_URLS[role as keyof typeof PORTAL_URLS]
  await page.waitForURL(`**${portalUrl}*`, { timeout: 30000 })
  console.log(`[${role}] Login successful, on page: ${page.url()}`)
}

async function takeFullPageScreenshot(page: any, filename: string) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, filename),
    fullPage: true,
  })
}

async function captureTourScreenshots(page: any, role: string) {
  const screenshotFile = (step: number, label: string) =>
    takeFullPageScreenshot(page, `${role}-${String(step).padStart(2, '0')}-${label}.png`)

  let step = 1

  // Step 1: Before tour
  await screenshotFile(step++, 'before-tour')

  // Step 2: Check if tour trigger button exists
  const trigger = page.locator('[data-tour-id="topbar-tour-trigger"]')
  const triggerCount = await trigger.count()
  console.log(`[${role}] Tour trigger button count: ${triggerCount}`)

  if (triggerCount > 0) {
    // Click the tour trigger
    await trigger.click()
    console.log(`[${role}] Clicked tour trigger`)
  } else {
    console.log(`[${role}] Tour trigger button not found - tour may auto-start`)
  }

  // Step 3: Wait for tour tooltip
  // react-joyride v3.2.0 uses `react-joyride__tooltip` class
  let tourVisible = false
  try {
    await page.waitForSelector('.react-joyride__tooltip', { state: 'visible', timeout: 10000 })
    tourVisible = true
    console.log(`[${role}] Tour tooltip appeared!`)
  } catch {
    console.log(`[${role}] Tour tooltip did not appear after trigger click`)
  }

  if (tourVisible) {
    await screenshotFile(step++, 'tour-started')

    // Navigate through tour steps
    let safety = 0
    while (tourVisible && safety < 20) {
      safety++

      // Find the primary/next button
      const primaryBtn = page.locator('.react-joyride__button--primary, .react-joyride__button--next')
      const primaryCount = await primaryBtn.count()

      if (primaryCount === 0) {
        // No primary button - check if tooltip is still visible
        const tooltip = page.locator('.react-joyride__tooltip')
        if (await tooltip.count() === 0) {
          tourVisible = false
          break
        }
        // Tooltip visible but no buttons - just screenshot and wait
        await page.waitForTimeout(1000)
        continue
      }

      // Check button text
      const btnText = await primaryBtn.first().textContent().catch(() => '')
      const isFinish = btnText?.toLowerCase()?.includes('finish') ?? false
      const isSkip = btnText?.toLowerCase()?.includes('skip') ?? false

      console.log(`[${role}] Step ${safety}: button text = "${btnText?.trim()}", finish=${isFinish}, skip=${isSkip}`)

      if (isFinish) {
        await screenshotFile(step++, `step-finish`)
        await primaryBtn.first().click()
        await page.waitForTimeout(1000)
        break
      } else if (isSkip) {
        console.log(`[${role}] Skip button found, clicking it`)
        await screenshotFile(step++, 'step-skip')
        await primaryBtn.first().click()
        await page.waitForTimeout(1000)
        break
      } else {
        await screenshotFile(step++, `step-${safety}`)
        await primaryBtn.first().click()
        await page.waitForTimeout(800)
      }
    }
  }

  // Final: after tour
  await page.waitForTimeout(1000)
  await screenshotFile(step, 'after-tour')
  console.log(`[${role}] Captured ${step} screenshots`)
}

async function testPortal(role: string) {
  console.log(`\n==================== Testing ${role} portal ====================`)

  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  })

  // Capture console and page errors
  page.on('console', (msg: any) => {
    if (msg.type() === 'error') {
      console.log(`[${role}] Page error: ${msg.text()}`)
    }
  })
  page.on('pageerror', (err: any) => {
    console.log(`[${role}] JS Error: ${err.message}`)
  })
  page.on('requestfailed', (req: any) => {
    if (req.url().includes('/api/') || req.url().includes('favicon')) return
    console.log(`[${role}] Request failed: ${req.url()} - ${req.failure()?.errorText}`)
  })

  try {
    await loginAs(page, role)
    await captureTourScreenshots(page, role)
  } catch (e: any) {
    console.error(`[${role}] Error:`, e.message)
    await takeFullPageScreenshot(page, `${role}-error-${e.message.substring(0, 30)}.png`)
  } finally {
    await browser.close()
  }
}

async function main() {
  console.log('Starting AppTour verification across all 5 portals...')

  for (const role of ['staff', 'student', 'instructor', 'applicant', 'examiner'] as const) {
    await testPortal(role)
  }

  console.log('\n✅ All portal tour tests completed!')
  console.log(`Screenshots saved to: ${SCREENSHOT_DIR}`)

  // List all screenshots taken
  const files = fs.readdirSync(SCREENSHOT_DIR).filter(f => f.endsWith('.png'))
  console.log(`\nTotal screenshots: ${files.length}`)
  files.forEach(f => console.log(`  - ${f}`))
}

main().catch(console.error)
