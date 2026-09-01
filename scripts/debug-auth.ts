/**
 * Debug: Authenticate via browser, capture cookies, test tour
 */
import { chromium } from '@playwright/test'
import path from 'path'
import fs from 'fs'

const BASE_URL = 'http://localhost:3000'
const SCREENSHOT_DIR = 'tests/e2e/tour-screenshots'

async function main() {
  const log = (msg: string) => console.log(msg)

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`[console err] ${msg.text()}`)
  })
  page.on('pageerror', (err) => console.log(`[pageerror] ${err.message}`))

  // === Step 1: Go to login and fill form ===
  log('Step 1: Navigating to login page...')
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.fill('#email', 'staff@aerojet-academy.com')
  await page.fill('#password', 'Staff@2026')

  // === Step 2: Intercept the credentials response ===
  log('Step 2: Submitting form with response interception...')
  const [response] = await Promise.all([
    page.waitForResponse(async (resp) => {
      const url = resp.url()
      if (url.includes('/api/auth/callback/credentials')) {
        const body = await resp.text().catch(() => '')
        log(`  Auth response: status=${resp.status()}, url=${url}`)
        log(`  Response body (first 200): ${body?.substring(0, 200)}`)
        return true
      }
      return false
    }, { timeout: 30000 }).catch(() => {
      log('  No auth response captured')
      return null
    }),
    page.click('button[type="submit"]'),
  ])

  // === Step 3: Wait for redirect ===
  log('Step 3: Waiting for redirect...')
  await page.waitForTimeout(5000)
  log(`  URL after submit: ${page.url()}`)

  const cookies = await context.cookies()
  const sessionCookie = cookies.find(c => c.name === 'next-auth.session-token')
  log(`  Session token cookie: ${sessionCookie ? 'PRESENT' : 'NOT FOUND'}`)

  // Check for error message on page
  const errorDiv = await page.locator('.border-red-200, .bg-red-50').count()
  log(`  Error elements on page: ${errorDiv}`)
  if (errorDiv > 0) {
    const errorText = await page.locator('.border-red-200').first().textContent()
    log(`  Error text: ${errorText?.trim()}`)
  }

  // Take screenshot of current state
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'debug-auth-01-login-result.png'),
    fullPage: true,
  })

  // === Step 4: Try accessing staff dashboard directly ===
  log('Step 4: Navigating to staff dashboard...')
  await page.goto(`${BASE_URL}/staff/dashboard`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(5000)
  log(`  URL: ${page.url()}`)

  // Check what's on the page
  const bodyText = await page.locator('body').textContent().catch(() => '')
  const hasSignIn = bodyText?.includes('Sign In')
  const hasDashboard = bodyText?.includes('Dashboard')
  const hasWelcome = bodyText?.includes('Welcome')
  const hasError = bodyText?.includes('error') || bodyText?.includes('Error')
  log(`  Has "Sign In": ${hasSignIn}`)
  log(`  Has "Dashboard": ${hasDashboard}`)
  log(`  Has "Welcome": ${hasWelcome}`)
  log(`  Has "error": ${hasError}`)

  // Check for tour trigger button
  const triggerCount = await page.locator('[data-tour-id="topbar-tour-trigger"]').count()
  log(`  Tour trigger button: ${triggerCount}`)

  // Check for joyride elements
  const joyrideTooltip = await page.locator('.react-joyride__tooltip').count()
  const joyrideOverlay = await page.locator('.react-joyride__overlay').count()
  log(`  Joyride tooltip: ${joyrideTooltip}, overlay: ${joyrideOverlay}`)

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'debug-auth-02-staff-dashboard.png'),
    fullPage: true,
  })

  // === Step 5: If we're actually on the dashboard, try the tour ===
  if (triggerCount > 0) {
    log('\nStep 5: Clicking tour trigger button...')
    const trigger = page.locator('[data-tour-id="topbar-tour-trigger"]')
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click({ position: { x: 16, y: 16 } })
    log('  Clicked!')
    await page.waitForTimeout(5000)

    const tooltipAfter = await page.locator('.react-joyride__tooltip').count()
    const overlayAfter = await page.locator('.react-joyride__overlay').count()
    log(`  After click - tooltip: ${tooltipAfter}, overlay: ${overlayAfter}`)

    // Search for ANY joyride elements in DOM
    const allJoyride = await page.evaluate(() => {
      const found: string[] = []
      document.querySelectorAll('*').forEach((el) => {
        const cls = (el as HTMLElement).className || ''
        if (typeof cls === 'string' && cls.includes('joyride')) {
          found.push(el.tagName)
        }
      })
      return [...new Set(found)]
    })
    log(`  Joyride elements in DOM: ${allJoyride.length} (${allJoyride.join(', ')})`)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'debug-auth-03-after-trigger-click.png'),
      fullPage: true,
    })

    // Also try dispatching event directly
    log('Step 6: Dispatching start-app-tour event...')
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('start-app-tour'))
    })
    await page.waitForTimeout(3000)

    const tooltipManual = await page.locator('.react-joyride__tooltip').count()
    log(`  After manual event - tooltip: ${tooltipManual}`)

    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, 'debug-auth-04-after-manual-event.png'),
      fullPage: true,
    })
  } else {
    log('\nStep 5: No tour trigger button found')

    // Check if we're on the login page
    if (page.url().includes('/login')) {
      log('  We are on the login page - login failed!')
      const errorEl = await page.locator('.border-red-200, [class*="error"], [class*="red"]').count()
      log(`  Error-like elements: ${errorEl}`)

      // Try to get the full page text
      const fullText = await page.locator('body').textContent()
      const errorLines = fullText?.split('\n').filter(l => l.includes('Invalid') || l.includes('error') || l.includes('Error') || l.includes('wrong'))
      log(`  Potential error lines: ${errorLines?.length || 0}`)
      if (errorLines && errorLines.length > 0) {
        errorLines.forEach(l => log(`    > ${l.trim()}`))
      }
    }
  }

  await browser.close()
  log('\n=== Done ===')
}

main().catch(console.error)
