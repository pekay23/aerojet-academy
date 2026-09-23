import { test, expect, Page } from '@playwright/test'
import { loginAs, getStudentCredentials, getInstructorCredentials } from './helpers/auth'

/**
 * Mobile layout audit (375px). NOT a correctness test — a diagnostic sweep.
 * Visits every static route in the student / instructor / applicant portals
 * at phone width and reports page-level horizontal overflow + the offending
 * elements so they can be fixed. Run with: bun run test:e2e tests/e2e/mobile-audit.spec.ts
 */

const MOBILE = { width: 375, height: 812 }

const STUDENT_ROUTES = [
  '/student',
  '/student/academic-calendar',
  '/student/ambassador',
  '/student/attendance',
  '/student/classmates',
  '/student/courses',
  '/student/courses/enroll',
  '/student/courses/revision',
  '/student/documents',
  '/student/certificates',
  '/student/exam-bookings',
  '/student/exam-bookings/my-bookings',
  '/student/exams',
  '/student/exams/internal',
  '/student/exams/results',
  '/student/exams/schedule',
  '/student/grades',
  '/student/license-progress',
  '/student/messages',
  '/student/notifications',
  '/student/ojt',
  '/student/profile',
  '/student/profile/settings',
  '/student/registration-fee',
  '/student/resources',
  '/student/seating',
  '/student/transcript',
  '/student/wallet',
  '/student/wallet/top-up',
  '/student/wallet/transactions',
  '/student/withdrawal',
]

const INSTRUCTOR_ROUTES = [
  '/instructor',
  '/instructor/dashboard',
  '/instructor/classes',
  '/instructor/grading',
  '/instructor/grading/pending',
  '/instructor/grading/history',
  '/instructor/profile',
  '/instructor/resources',
  '/instructor/schedule',
  '/instructor/students',
  '/instructor/availability',
  '/instructor/materials',
  '/instructor/metrics',
]

const APPLICANT_ROUTES = [
  '/applicant',
  '/applicant/dashboard',
  '/applicant/application/documents',
  '/applicant/application/interview',
  '/applicant/application/medical',
  '/applicant/application/payment',
  '/applicant/application/status',
  '/applicant/application/aptitude-test',
  '/applicant/courses',
  '/applicant/courses/purchase',
  '/applicant/exam-bookings',
  '/applicant/exam-only',
  '/applicant/exam-only/dashboard',
  '/applicant/exam-only/top-up',
  '/applicant/notifications',
  '/applicant/pathway',
  '/applicant/profile',
  '/applicant/wallet-top-up',
]

async function loginApplicant(page: Page) {
  const email = process.env.E2E_APPLICANT_EMAIL
  const password = process.env.E2E_APPLICANT_PASSWORD

  if (!email || !password) {
    console.error(
      'ERROR: E2E_APPLICANT_EMAIL and E2E_APPLICANT_PASSWORD environment variables are required'
    )
    process.exit(1)
  }

  await page.goto('/login')
  await page.fill('#email', email)
  await page.fill('#password', password)
  await page.click('button[type="submit"]')
  // Applicant landing varies by stage; just wait until we leave /login.
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 })
}

type Offender = { route: string; overflowPx: number; elements: string[] }

async function auditRoute(page: Page, route: string): Promise<Offender | null> {
  // NB: `networkidle` never settles here — Heartbeat pings every 30s and
  // several pages poll, so the network is never quiet. Use domcontentloaded.
  await page.goto(route, { waitUntil: 'domcontentloaded' }).catch(() => {})
  // Give client components / animations a beat to settle.
  await page.waitForTimeout(600)

  // Applicant routes do stage-gated client redirects that destroy the eval
  // context mid-flight. Retry once after letting the redirect land.
  const evaluateOverflow = () =>
    page.evaluate(() => {
      const docEl = document.documentElement
      const vw = window.innerWidth
      const overflowPx = docEl.scrollWidth - vw
      if (overflowPx <= 1) return null

      // Find elements whose right edge exceeds the viewport AND that are not
      // inside a horizontally-scrollable ancestor (those are intentional).
      const isScrollable = (el: Element) => {
        const s = getComputedStyle(el)
        return /(auto|scroll)/.test(s.overflowX)
      }
      const hasScrollableAncestor = (el: Element) => {
        let p = el.parentElement
        while (p) {
          if (isScrollable(p) && p.scrollWidth > p.clientWidth) return true
          p = p.parentElement
        }
        return false
      }

      const offenders: string[] = []
      const seen = new Set<string>()
      document.querySelectorAll('body *').forEach((el) => {
        const r = el.getBoundingClientRect()
        if (r.width === 0 || r.height === 0) return
        if (r.right <= vw + 1) return
        if (hasScrollableAncestor(el)) return
        const cls = (el.getAttribute('class') || '').slice(0, 80)
        const sig = `${el.tagName.toLowerCase()}.${cls}|w=${Math.round(r.width)}|right=${Math.round(r.right)}`
        if (!seen.has(sig)) {
          seen.add(sig)
          offenders.push(sig)
        }
      })
      return { overflowPx, elements: offenders.slice(0, 8) }
    })

  let result: { overflowPx: number; elements: string[] } | null = null
  try {
    result = await evaluateOverflow()
  } catch {
    // Likely a redirect destroyed the context — let it land and retry once.
    await page.waitForTimeout(800)
    result = await evaluateOverflow().catch(() => null)
  }

  if (!result) return null
  return { route, overflowPx: result.overflowPx, elements: result.elements }
}

async function sweep(page: Page, routes: string[], label: string): Promise<Offender[]> {
  const offenders: Offender[] = []
  for (const route of routes) {
    const o = await auditRoute(page, route)
    if (o) offenders.push(o)
  }
  console.log(`\n===== MOBILE AUDIT: ${label} (${routes.length} routes) =====`)
  if (offenders.length === 0) {
    console.log('  ✓ No page-level horizontal overflow detected.')
  } else {
    for (const o of offenders) {
      console.log(`\n  ✗ ${o.route}  (+${o.overflowPx}px)`)
      o.elements.forEach((e) => console.log(`      ${e}`))
    }
  }
  console.log(`===== END ${label}: ${offenders.length}/${routes.length} pages overflow =====\n`)
  return offenders
}

// A page overflowing horizontally at phone width is a layout regression.
// The detailed offender list is printed above for whoever has to fix it.
function expectNoOverflow(offenders: Offender[]) {
  expect(offenders.map((o) => o.route)).toEqual([])
}

test.describe('Mobile layout audit @375px', () => {
  test.use({ viewport: MOBILE })
  // Each test sweeps many routes; well beyond the 30s default.
  test.setTimeout(300_000)

  test('student portal', async ({ page }) => {
    await loginAs(page, getStudentCredentials())
    expectNoOverflow(await sweep(page, STUDENT_ROUTES, 'STUDENT'))
  })

  test('instructor portal', async ({ page }) => {
    await loginAs(page, getInstructorCredentials())
    expectNoOverflow(await sweep(page, INSTRUCTOR_ROUTES, 'INSTRUCTOR'))
  })

  test('applicant portal', async ({ page }) => {
    await loginApplicant(page)
    expectNoOverflow(await sweep(page, APPLICANT_ROUTES, 'APPLICANT'))
  })
})
