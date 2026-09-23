/**
 * Comprehensive debug: login, navigate, inspect DOM for tour trigger
 * Requires: E2E_STAFF_EMAIL, E2E_STAFF_PASSWORD env vars
 */
import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs'
import { config } from 'dotenv'
config()

const BASE_URL = 'http://localhost:3000'
const SCREENSHOT_DIR = path.join(process.cwd(), 'tests', 'e2e', 'tour-screenshots')

const staffEmail = process.env.E2E_STAFF_EMAIL || 'staff@aerojet-academy.com'
const staffPassword = process.env.E2E_STAFF_PASSWORD || ''

if (!staffPassword) {
  console.error('ERROR: E2E_STAFF_PASSWORD environment variable is required')
  process.exit(1)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  })

  const logs: string[] = []
  const log = (msg: string) => {
    logs.push(msg)
    console.log(msg)
  }

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      logs.push(`[console error] ${msg.text()}`)
      console.log(`[console error] ${msg.text()}`)
    }
  })
  page.on('pageerror', (err) => {
    logs.push(`[pageerror] ${err.message}`)
    console.log(`[pageerror] ${err.message}`)
  })

  // Step 1: Login
  log('Step 1: Logging in as staff...')
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.fill('#email', staffEmail)
  await page.fill('#password', staffPassword)

  // Wait for submit button
  await page.waitForSelector('button[type="submit"]', { state: 'visible' })

  // Click submit and wait for navigation
  log('Step 2: Clicking submit...')
  await Promise.all([
    page
      .waitForNavigation({ timeout: 30000 })
      .catch(() => log('  (no navigation event, might be client-side)')),
    page.click('button[type="submit"]'),
  ])

  // Wait for redirect
  await page.waitForTimeout(3000)
  log(`Step 3: URL after login: ${page.url()}`)

  // Wait for any dashboard text
  try {
    await page.waitForSelector('text=/Dashboard|Welcome/i', { timeout: 15000 })
    log('Dashboard text found!')
  } catch {
    log('Dashboard text NOT found')
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'debug-staff-dashboard.png'),
    fullPage: true,
  })

  // Step 4: Check for tour trigger button with various selectors
  log('Step 4: Checking for tour trigger button...')

  const selectors = [
    '[data-tour-id="topbar-tour-trigger"]',
    '.react-joyride__tooltip',
    '[data-tour-id]',
    'button[title*="tour" i]',
    'button[title*="Tour"]',
    'button svg.lucide-info',
    '.lucide-info',
    'header button',
    '[aria-label="Help"]',
  ]

  for (const sel of selectors) {
    const count = await page.locator(sel).count()
    log(`  Selector "${sel}": ${count} elements found`)
    if (count > 0) {
      const isVisible = await page.locator(sel).first().isVisible()
      const boundingBox = await page.locator(sel).first().boundingBox()
      log(`    visible: ${isVisible}, boundingBox: ${JSON.stringify(boundingBox)}`)
    }
  }

  // Step 5: Check for AppTour component
  log('Step 5: Checking for tour-related elements...')
  const joyrideCount = await page.locator('.react-joyride__tooltip').count()
  log(`  react-joyride__tooltip: ${joyrideCount}`)
  const joyrideOverlay = await page.locator('.react-joyride__overlay').count()
  log(`  react-joyride__overlay: ${joyrideOverlay}`)
  const joyridePortal = await page.locator('.joyride-portal').count()
  log(`  joyride-portal: ${joyridePortal}`)

  // Step 6: Dump HTML of header area
  const headerHtml = await page
    .locator('header, [class*="topbar"], [class*="TopBar"]')
    .first()
    .evaluate((el) => el.outerHTML?.substring(0, 500) || 'not found')
  log(`Step 6: Header HTML: ${headerHtml}`)

  // Step 7: Check for any elements with data-tour-id
  const tourElements = await page.locator('[data-tour-id]').allTextContents()
  log(`Step 7: Tour elements found: ${tourElements.length}`)
  tourElements.forEach((text, i) => log(`  ${i}: ${text || '(empty text)'}`))

  // Save debug log
  fs.writeFileSync(path.join(SCREENSHOT_DIR, 'debug-staff-full-log.txt'), logs.join('\n'))

  await browser.close()
  log('\nDebug complete!')
}

main().catch(console.error)
