/**
 * Debug login flow - step by step with screenshots
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

  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      console.log(`[console ${msg.type()}] ${msg.text()}`)
    }
  })
  page.on('pageerror', (err) => {
    console.log(`[pageerror] ${err.message}`)
  })

  // Step 1: Go to login
  console.log('Step 1: Navigating to login page...')
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'debug-01-login-page.png'),
    fullPage: true,
  })
  console.log('Current URL:', page.url())

  // Step 2: Fill email
  console.log('Step 2: Filling email...')
  const emailInput = page.locator('#email')
  const emailExists = await emailInput.count()
  console.log('Email input found:', emailExists > 0)
  if (emailExists > 0) {
    await emailInput.fill('staff@aerojet-academy.com')
  }

  // Step 3: Fill password
  console.log('Step 3: Filling password...')
  const passwordInput = page.locator('#password')
  const passwordExists = await passwordInput.count()
  console.log('Password input found:', passwordExists > 0)
  if (passwordExists > 0) {
    await passwordInput.fill('REDACTED_PASSWORD')
  }

  // Step 4: Check for submit button
  console.log('Step 4: Looking for submit button...')
  const submitBtn = page.locator('button[type="submit"]')
  const submitExists = await submitBtn.count()
  console.log('Submit button found:', submitExists > 0)
  if (submitExists > 0) {
    const btnText = await submitBtn.first().textContent()
    console.log('Submit button text:', btnText?.trim())
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'debug-02-form-filled.png'),
    fullPage: true,
  })

  // Step 5: Click submit and wait
  console.log('Step 5: Clicking submit...')
  if (submitExists > 0) {
    await submitBtn.first().click()
  }

  // Wait a bit and check URL
  await page.waitForTimeout(5000)
  console.log('After submit, URL:', page.url())

  // Check for any error messages
  const errorElements = await page.locator('.error, .alert-error, [class*="error"], [role="alert"]').count()
  console.log('Error elements found:', errorElements)

  // Check if we see any validation messages
  const bodyText = await page.locator('body').textContent()
  if (bodyText) {
    // Look for common error indicators
    const hasInvalid = bodyText.includes('Invalid') || bodyText.includes('incorrect') || bodyText.includes('error')
    const hasPasswordError = bodyText.includes('Password is incorrect')
    const hasEmailError = bodyText.includes('Email is incorrect')
    console.log('Has error text:', hasInvalid)
    console.log('Has password error:', hasPasswordError)
    console.log('Has email error:', hasEmailError)
  }

  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'debug-03-after-submit.png'),
    fullPage: true,
  })

  // Try waiting for dashboard text
  try {
    await page.waitForSelector('text=/Dashboard|Welcome/i', { timeout: 10000 })
    console.log('Dashboard text found!')
  } catch {
    console.log('Dashboard text NOT found')
    // Dump more body text
    const bodyContent = await page.locator('body').textContent()
    console.log('Body text (first 500 chars):', bodyContent?.substring(0, 500))
  }

  await browser.close()
  console.log('\nDebug complete. Screenshots saved.')
}

main().catch(console.error)


