/**
 * Portal Exploration & Issue Discovery Script
 *
 * Browses all 5 portals, checking for:
 * - Console errors (React errors, hydration mismatches)
 * - Network errors (404, 5xx)
 * - Visual UI issues (via screenshots)
 * - Broken links
 *
 * Run: npx playwright test portal-explore --config=tests/e2e/tour-verification.config.ts
 */

import { test, expect, Page, Route } from '@playwright/test'
import type { Response } from '@playwright/test'
import * as fs from 'fs'
import * as fs from 'fs'

const SCREENSHOT_DIR = 'tests/e2e/portal-explore-screenshots'

interface PortalConfig {
  name: string
  role: string
  email: string
  password: string
  dashboardUrl: string
  pathsToVisit: string[]
}

const PORTALS: PortalConfig[] = [
  {
    name: 'Staff',
    role: 'staff',
    email: 'staff@aerojet-academy.com',
    password: 'REDACTED_PASSWORD',
    dashboardUrl: '/staff/dashboard',
    pathsToVisit: [
      '/staff/dashboard',
      '/staff/courses',
      '/staff/classes',
      '/staff/exams',
      '/staff/students',
      '/staff/newsroom',
      '/staff/settings',
    ],
  },
  {
    name: 'Student',
    role: 'student',
    email: 'student@aerojet-academy.com',
    password: 'REDACTED_PASSWORD',
    dashboardUrl: '/student',
    pathsToVisit: [
      '/student',
      '/student/exams',
      '/student/grades',
      '/student/schedule',
      '/student/messages',
    ],
  },
  {
    name: 'Instructor',
    role: 'instructor',
    email: 'instructor@aerojet-academy.com',
    password: 'REDACTED_PASSWORD',
    dashboardUrl: '/instructor/dashboard',
    pathsToVisit: [
      '/instructor/dashboard',
      '/instructor/classes',
      '/instructor/materials',
      '/instructor/exams',
      '/instructor/grades',
    ],
  },
  {
    name: 'Applicant',
    role: 'applicant',
    email: 'applicant@example.com',
    password: 'REDACTED_PASSWORD',
    dashboardUrl: '/applicant',
    pathsToVisit: [
      '/applicant',
      '/applicant/applications',
      '/applicant/documents',
      '/applicant/status',
      '/applicant/messages',
    ],
  },
  {
    name: 'Examiner',
    role: 'examiner',
    email: 'examiner@aerojet-academy.com',
    password: 'REDACTED_PASSWORD',
    dashboardUrl: '/examiner',
    pathsToVisit: [
      '/examiner',
      '/examiner/exams',
      '/examiner/schedule',
      '/examiner/results',
    ],
  },
]

interface IssueRecord {
  portal: string
  url: string
  type: 'console-error' | 'network-error' | 'hydration-error' | 'react-error'
  message: string
  context?: string
}

const issues: IssueRecord[] = []

function logIssue(portal: string, url: string, type: IssueRecord['type'], message: string, context?: string) {
  const record = { portal, url, type, message: message.slice(0, 500), context }
  issues.push(record)
  console.log(`[${type.toUpperCase()}] ${portal} @ ${url}: ${message.slice(0, 200)}`)
}

async function loginViaApi(page: Page, portal: PortalConfig): Promise<boolean> {
  try {
    await page.goto('/login', { waitUntil: 'domcontentloaded', timeout: 30000 })
  } catch {
    // If login page isn't accessible, try direct nav
  }

  // Get CSRF token
  const csrfResp = await page.request.get('/api/auth/csrf')
  const csrfJson = await csrfResp.json()
  const csrfToken = csrfJson.csrfToken

  // Post credentials
  const loginResp = await page.request.post('/api/auth/callback/credentials', {
    data: {
      csrfToken,
      email: portal.email,
      password: portal.password,
      redirect: 'false',
    },
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })

  if (loginResp.status() === 401) {
    console.log(`[${portal.name}] Login failed with 401`)
    return false
  }

  // Check for session cookie
  const cookies = await page.context().cookies()
  const hasSession = cookies.some(c => c.name.includes('next-auth'))
  return hasSession
}

async function setupConsoleAndNetworkCapture(page: Page, portal: PortalConfig) {
  page.on('console', msg => {
    const text = msg.text()
    const location = msg.location()

    // Skip warnings and info in production
    if (msg.type() === 'error') {
      logIssue(portal.name, page.url(), 'console-error', text, location ? `${location.url}:${location.lineNumber}` : undefined)
    } else if (msg.type() === 'warning' && (text.includes(' hydration') || text.includes('Hydration'))) {
      logIssue(portal.name, page.url(), 'hydration-error', text, location ? `${location.url}:${location.lineNumber}` : undefined)
    } else if (text.includes('Minified React error') || text.includes('React Error')) {
      logIssue(portal.name, page.url(), 'react-error', text, location ? `${location.url}:${location.lineNumber}` : undefined)
    }
  })

  page.on('pageerror', error => {
    const msg = error.message
    const stack = error.stack || ''
    logIssue(portal.name, page.url(), 'react-error', msg, stack.slice(0, 300))
  })

  page.on('response', (response: Response) => {
    const url = response.url()
    const status = response.status()

    // Network errors
    if (status === 404) {
      const path = new URL(url).pathname
      logIssue(portal.name, page.url(), 'network-error', `404 Not Found: ${path}`)
    } else if (status >= 500) {
      const path = new URL(url).pathname
      logIssue(portal.name, page.url(), 'network-error', `${status} error: ${path}`)
    }
  })
}

async function explorePortal(page: Page, portal: PortalConfig) {
  console.log(`\n=== ${portal.name} Portal ===`)

  const loggedIn = await loginViaApi(page, portal)
  if (!loggedIn) {
    console.log(`[${portal.name}] Failed to login — skipping`)
    return
  }

  console.log(`[${portal.name}] Logged in successfully, exploring paths...`)

  for (const path of portal.pathsToVisit) {
    try {
      console.log(`[${portal.name}] Navigating to ${path}...`)

      const response = await page.goto(`http://localhost:3000${path}`, {
        waitUntil: 'load',
        timeout: 30000,
      })

      if (response) {
        const status = response.status()
        if (status >= 400) {
          logIssue(portal.name, path, 'network-error', `HTTP ${status} on navigation to ${path}`)
        }
      }

      // Wait for page to settle
      await page.waitForTimeout(2000)

      // Screenshot
      const screenshotName = path.replace(/[\/\\]/g, '_').replace(/_$/, '')
      await page.screenshot({
        path: `${SCREENSHOT_DIR}/${portal.role}-${screenshotName}.png`,
        fullPage: true,
      })

      // Check for error boundaries
      const errorText = await page.locator('text=/Error|Error Boundary|Something went wrong/i').count()
      if (errorText > 0) {
        const errorContent = await page.locator('text=/Error|Error Boundary|Something went wrong/i').first().textContent()
        logIssue(portal.name, path, 'console-error', `Error boundary detected: ${errorContent}`)
      }
    } catch (err: any) {
      logIssue(portal.name, path, 'network-error', `Navigation error: ${err.message}`)
    }
  }
}

test.describe('Portal Exploration & Issue Discovery', () => {
  test('explore all portals for issues', async ({ browser }) => {
    const results: Record<string, any> = {}

    for (const portal of PORTALS) {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
      })
      const page = await context.newPage()

      await setupConsoleAndNetworkCapture(page, portal)

      await explorePortal(page, portal)

      await page.close()
      await context.close()
    }

    // Summary
    console.log('\n=== Issue Summary ===')
    console.log(`Total issues found: ${issues.length}`)

    const byPortal = new Map<string, number>()
    const byType = new Map<string, number>()

    for (const issue of issues) {
      byPortal.set(issue.portal, (byPortal.get(issue.portal) || 0) + 1)
      byType.set(issue.type, (byType.get(issue.type) || 0) + 1)
    }

    console.log('\nBy Portal:')
    for (const [portal, count] of byPortal) {
      console.log(`  ${portal}: ${count}`)
    }

    console.log('\nBy Type:')
    for (const [type, count] of byType) {
      console.log(`  ${type}: ${count}`)
    }

    // Write full report
    const reportPath = `${SCREENSHOT_DIR}/issues-report.json`
    fs.mkdirSync(SCREENSHOT_DIR, { recursive: true })
    fs.writeFileSync(reportPath, JSON.stringify(issues, null, 2))
    console.log(`\nFull report: ${reportPath}`)
  })
})
