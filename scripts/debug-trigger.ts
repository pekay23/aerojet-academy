/**
 * Debug: Login as staff, click tour trigger, verify Joyride renders
 */
import { chromium } from '@playwright/test'
import path from 'path'

const BASE_URL = 'http://localhost:3000'
const SCREENSHOT_DIR = path.join(process.cwd(), 'tests', 'e2e', 'tour-screenshots')

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  })

  const log = (msg: string) => console.log(msg)

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`[console error] ${msg.text()}`)
    }
  })
  page.on('pageerror', (err) => {
    console.log(`[pageerror] ${err.message}`)
  })

  // === LOGIN ===
  log('=== LOGIN ===')
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.fill('#email', 'staff@aerojet-academy.com')
  await page.fill('#password', 'REDACTED_PASSWORD')

  // Click submit and wait for navigation
  await Promise.all([
    page.waitForNavigation({ timeout: 30000 }).catch(() => log('  (navigation handled by JS)')),
    page.click('button[type="submit"]'),
  ])

  // Wait for redirect
  await page.waitForTimeout(5000)
  log(`URL: ${page.url()}`)

  // Verify dashboard loaded
  await page.waitForSelector('text=/Dashboard|Welcome/i', { timeout: 15000 })
  log('Dashboard loaded')

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'debug-staff-01-dashboard.png'),
    fullPage: true,
  })

  // === CHECK TOUR STATE ===
  log('\n=== CHECK TOUR STATE ===')

  // Check trigger button
  const triggerCount = await page.locator('[data-tour-id="topbar-tour-trigger"]').count()
  log(`Tour trigger button: ${triggerCount} elements`)

  // Check for Joyride elements
  const joyrideTooltip = await page.locator('.react-joyride__tooltip').count()
  const joyrideOverlay = await page.locator('.react-joyride__overlay').count()
  const joyridePortal = await page.locator('.joyride-portal').count()
  log(`Joyride tooltip: ${joyrideTooltip}, overlay: ${joyrideOverlay}, portal: ${joyridePortal}`)

  // Check hasCompletedTour in the HTML/data
  const hasCompletedText = await page.locator('body').textContent()
  const tourCompleted = hasCompletedText?.includes('hasCompletedTour')
  log(`hasCompletedTour visible in HTML: ${tourCompleted}`)

  // === CLICK TOUR TRIGGER ===
  log('\n=== CLICK TOUR TRIGGER ===')
  if (triggerCount > 0) {
    const trigger = page.locator('[data-tour-id="topbar-tour-trigger"]')
    await trigger.scrollIntoViewIfNeeded()
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'debug-staff-02-before-click.png'),
      fullPage: true,
    })

    await trigger.click({ position: { x: 16, y: 16 } })
    log('Clicked tour trigger')
    await page.waitForTimeout(5000)

    // Check if tooltip appeared
    const tooltipAfter = await page.locator('.react-joyride__tooltip').count()
    log(`Joyride tooltip after click: ${tooltipAfter}`)

    const overlayAfter = await page.locator('.react-joyride__overlay').count()
    log(`Joyride overlay after click: ${overlayAfter}`)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'debug-staff-03-after-click.png'),
      fullPage: true,
    })
  } else {
    log('No tour trigger button found - skipping click test')
  }

  // === Try dispatching event manually ===
  log('\n=== MANUAL EVENT DISPATCH ===')
  await page.evaluate(() => {
    const event = new CustomEvent('start-app-tour')
    window.dispatchEvent(event)
    console.log('[debug] start-app-tour event dispatched')
  })
  await page.waitForTimeout(5000)

  const tooltipManual = await page.locator('.react-joyride__tooltip').count()
  log(`Joyride tooltip after manual event: ${tooltipManual}`)

  // Check for any joyride elements in DOM
  const joyrideInDOM = await page.evaluate(() => {
    const all = document.querySelectorAll('*')
    const found: string[] = []
    all.forEach((el) => {
      const cls = (el as HTMLElement).className || ''
      if (typeof cls === 'string' && cls.includes('joyride')) {
        found.push(`${el.tagName}.${cls.slice(0, 80)}`)
      }
    })
    return found.slice(0, 20)
  })
  log(`Joyride elements in DOM: ${joyrideInDOM.length}`)
  if (joyrideInDOM.length > 0) {
    log(`  Sample: ${joyrideInDOM[0]}`)
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'debug-staff-04-manual-event.png'),
    fullPage: true,
  })

  await browser.close()
  log('\n=== DEBUG COMPLETE ===')
}

main().catch(console.error)


