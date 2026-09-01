/**
 * Debug login flow - capture error message
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

  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' })

  await page.fill('#email', 'staff@aerojet-academy.com')
  await page.fill('#password', 'REDACTED_PASSWORD')

  // Wait for submit button to be enabled
  const submitBtn = page.locator('button[type="submit"]')
  await submitBtn.waitFor({ state: 'visible' })

  // Click and wait for response
  await Promise.all([
    page.waitForURL(`**/*`, { timeout: 30000 }).catch(() => {}), // Ignore URL changes
    submitBtn.click(),
  ])

  // Wait for any async processing
  await page.waitForTimeout(5000)

  // Check current URL
  console.log('URL after login:', page.url())

  // Check for error message
  const errorDiv = page.locator('.rounded-xl.border.border-red-200')
  if (await errorDiv.count() > 0) {
    const errorText = await errorDiv.first().textContent()
    console.log('Error message:', errorText?.trim())
  }

  // Check for 2FA field
  const totpInput = page.locator('#totpCode')
  if (await totpInput.count() > 0) {
    console.log('2FA code input is visible - 2FA required!')
  }

  // Check if we see "Signing In..." (loading state)
  if (await page.locator('text=Signing In').count() > 0) {
    console.log('Login is still processing (Signing In...)')
    await page.waitForTimeout(5000)
  }

  // Check URL again
  console.log('URL after waiting:', page.url())

  // Take screenshot
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, 'debug-error-message.png'),
    fullPage: true,
  })

  // Get all body text
  const bodyText = await page.locator('body').textContent()
  console.log('Body text (first 300 chars):', bodyText?.substring(0, 300))

  await browser.close()
}

main().catch(console.error)
