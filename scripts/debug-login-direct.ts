/**
 * Debug: Login via direct CSRF → credentials callback, then verify session
 */
import { chromium } from '@playwright/test'

(async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()

  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log('[console error]', msg.text())
  })
  page.on('pageerror', (err) => console.log('[pageerror]', err.message))
  page.on('response', (resp) => {
    const url = resp.url()
    if (url.includes('auth')) console.log(`[resp] ${resp.status()} ${url.split('?')[0]}`)
  })

  // Step 1: Fetch CSRF token from API
  console.log('Step 1: Fetching CSRF token from /api/auth/csrf...')
  const csrfResp = await page.request.get('http://localhost:3000/api/auth/csrf')
  const csrfData = await csrfResp.json()
  const csrfToken = csrfData.csrfToken
  console.log('CSRF token:', csrfToken ? csrfToken.substring(0, 30) + '...' : 'NOT FOUND')

  // Step 2: POST credentials with CSRF token
  console.log('\nStep 2: POSTing credentials...')
  const body = new URLSearchParams({
    csrfToken,
    email: 'staff@aerojet-academy.com',
    password: 'Staff@2026',
    redirect: 'false',
  }).toString()

  const response = await page.request.post('http://localhost:3000/api/auth/callback/credentials', {
    data: body,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
  console.log('Response status:', response.status())
  const respBody = await response.text()
  console.log('Response body (first 200):', respBody.substring(0, 200))

  const setCookies = response.headers()['set-cookie']
  console.log('Set-Cookie present:', setCookies ? setCookies.substring(0, 100) : 'NONE')

  // Step 3: Check cookies
  const cookies = await context.cookies()
  const sessionCookie = cookies.find((c) => c.name.includes('session'))
  console.log('Session cookie:', sessionCookie ? `FOUND (${sessionCookie.name})` : 'NOT FOUND')
  console.log('All cookies:', cookies.map((c) => c.name).join(', '))

  // Step 4: Navigate to dashboard
  console.log('\nStep 4: Navigating to staff dashboard...')
  await page.goto('http://localhost:3000/staff/dashboard', { waitUntil: 'domcontentloaded' })
  await new Promise((r) => setTimeout(r, 5000))
  console.log('URL:', page.url())

  const bodyText = await page.locator('body').textContent()
  console.log('Has "Sign In":', bodyText?.includes('Sign In'))
  console.log('Has "Staff Dashboard":', bodyText?.includes('Staff Dashboard'))

  // Step 5: Check tour trigger
  const triggerCount = await page.locator('[data-tour-id="topbar-tour-trigger"]').count()
  console.log('Tour trigger button:', triggerCount)

  await page.screenshot({ path: 'tests/e2e/tour-screenshots/debug-direct-api.png', fullPage: true })
  await browser.close()
})().catch((e) => console.error('FATAL:', (e as Error).message))



