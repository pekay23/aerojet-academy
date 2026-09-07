/**
 * Debug: Direct API login to test credentials and session
 */
import { chromium } from '@playwright/test'

(async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  const page = await context.newPage()
  
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('[console error]', msg.text())
  })
  page.on('pageerror', err => console.log('[pageerror]', err.message))
  page.on('response', resp => {
    const url = resp.url()
    if (url.includes('auth') || url.includes('callback')) {
      console.log(`[resp] ${resp.status()} ${url}`)
    }
  })

  // Step 1: GET login page to obtain CSRF token
  console.log('Step 1: Getting CSRF token...')
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle', timeout: 30000 })
  
  // Find CSRF token in the page
  const csrfToken = await page.evaluate(() => {
    // NextAuth stores csrf token in a hidden input or in a meta tag
    const input = document.querySelector('input[name="csrfToken"]')
    if (input) return input.value
    // Try to find it in __NEXT_DATA__ or other locations
    const scripts = document.querySelectorAll('script')
    for (const s of scripts) {
      if (s.textContent && s.textContent.includes('csrfToken')) {
        const match = s.textContent.match(/"csrfToken":"([^"]+)"/)
        if (match) return match[1]
      }
    }
    return null
  })
  console.log('CSRF token:', csrfToken ? csrfToken.substring(0, 20) + '...' : 'NOT FOUND')

  // Step 2: POST to credentials callback directly
  console.log('\nStep 2: POSTing to /api/auth/callback/credentials...')
  const response = await page.request.post('http://localhost:3000/api/auth/callback/credentials', {
    data: new URLSearchParams({
      csrfToken: csrfToken || '',
      email: 'staff@aerojet-academy.com',
      password: 'Staff@2026',
      redirect: 'false',
    }).toString(),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
  console.log('Response status:', response.status())
  const body = await response.text()
  console.log('Response body (first 300):', body.substring(0, 300))
  
  // Check Set-Cookie headers
  const setCookies = response.headers()['set-cookie']
  console.log('Set-Cookie:', setCookies ? setCookies.substring(0, 200) : 'NONE')

  // Step 3: Check cookies in context
  const cookies = await context.cookies()
  console.log('\nCookies:', cookies.map(c => `${c.name}=${c.value?.substring(0, 20)}...`).join(', '))
  
  // Step 4: Try accessing dashboard
  console.log('\nStep 4: Navigating to staff dashboard...')
  await page.goto('http://localhost:3000/staff/dashboard', { waitUntil: 'domcontentloaded' })
  await new Promise(r => setTimeout(r, 3000))
  console.log('URL:', page.url())
  
  // Check if on login page
  const bodyText = await page.locator('body').textContent()
  const hasSignIn = bodyText?.includes('Sign In')
  const hasDashboard = bodyText?.includes('Dashboard') || bodyText?.includes('Staff')
  console.log('Has "Sign In" button:', hasSignIn)
  console.log('Has dashboard content:', hasDashboard)
  
  await page.screenshot({ path: 'tests/e2e/tour-screenshots/debug-direct-api.png', fullPage: true })
  
  await browser.close()
})().catch(e => console.error('FATAL:', (e as Error).message))



