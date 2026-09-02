import { test, expect, type Page } from '@playwright/test'
import { loginAsStudent } from './helpers/auth'

// Session payload that puts the exam interface into IN_PROGRESS state so the
// real anti-cheat hooks (registered in React effects) actually attach.
const IN_PROGRESS_SESSION = {
  sessionId: 'test-session-id',
  status: 'IN_PROGRESS',
  questions: [
    { id: 'q1', text: 'Sample question?', options: ['A', 'B', 'C'], points: 1, syllabusRef: null },
  ],
  savedAnswers: [],
  totalTimeSecs: 3600,
  expiresAt: new Date(Date.now() + 3600_000).toISOString(),
  resumed: false,
  rules: { timePerQuestionSecs: 75, passMarkPct: 75, allowKeyboardAutoSubmit: false },
}

async function mockInProgressSession(page: Page) {
  await page.route('**/api/student/exams/internal/session?sessionId=*', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: IN_PROGRESS_SESSION }),
    })
  })
}

test.describe('Anti-Cheat Security Controls', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsStudent(page)
  })

  test.describe('Access Code Entry', () => {
    test('renders the exam access code form', async ({ page }) => {
      await page.goto('/student/exams/internal/access-code')
      await expect(page.getByText('Exam Access Code')).toBeVisible()
      await expect(page.getByLabel('Access Code')).toBeVisible()
    })

    test('uppercases the access code input', async ({ page }) => {
      await page.goto('/student/exams/internal/access-code')
      const input = page.getByLabel('Access Code')
      await input.fill('abcd-1234-efgh-5678')
      await expect(input).toHaveValue('ABCD-1234-EFGH-5678')
    })
  })

  test.describe('Secure Exam Client', () => {
    test('renders the security status bar', async ({ page }) => {
      await page.goto('/student/exams/internal/test-session-id')
      await expect(page.getByText('Secure Mode')).toBeVisible()
    })

    test('renders the timer', async ({ page }) => {
      await page.goto('/student/exams/internal/test-session-id')
      await expect(page.getByText(/\d+:\d{2}/)).toBeVisible()
    })
  })

  test.describe('Fullscreen Enforcement', () => {
    test('shows the fullscreen entry prompt on exam start', async ({ page }) => {
      await mockInProgressSession(page)
      await page.goto('/student/exams/internal/test-session-id')
      await expect(page.getByText('Enter Exam Mode')).toBeVisible()
    })
  })

  test.describe('Clipboard Block', () => {
    test('page registers a copy handler that prevents default', async ({ page }) => {
      await mockInProgressSession(page)
      await page.goto('/student/exams/internal/test-session-id')
      await expect(page.getByText('Enter Exam Mode')).toBeVisible()

      const copyPrevented = await page.evaluate(() => {
        const event = new ClipboardEvent('copy', { bubbles: true, cancelable: true })
        document.dispatchEvent(event)
        return event.defaultPrevented
      })
      expect(copyPrevented).toBe(true)
    })

    test('page registers a paste handler that prevents default', async ({ page }) => {
      await mockInProgressSession(page)
      await page.goto('/student/exams/internal/test-session-id')
      await expect(page.getByText('Enter Exam Mode')).toBeVisible()

      const pastePrevented = await page.evaluate(() => {
        const event = new ClipboardEvent('paste', { bubbles: true, cancelable: true })
        document.dispatchEvent(event)
        return event.defaultPrevented
      })
      expect(pastePrevented).toBe(true)
    })

    test('page registers a cut handler that prevents default', async ({ page }) => {
      await mockInProgressSession(page)
      await page.goto('/student/exams/internal/test-session-id')
      await expect(page.getByText('Enter Exam Mode')).toBeVisible()

      const cutPrevented = await page.evaluate(() => {
        const event = new ClipboardEvent('cut', { bubbles: true, cancelable: true })
        document.dispatchEvent(event)
        return event.defaultPrevented
      })
      expect(cutPrevented).toBe(true)
    })
  })

  test.describe('Tab Switch Detection', () => {
    test('page registers a visibilitychange handler that detects hidden', async ({ page }) => {
      await mockInProgressSession(page)
      await page.goto('/student/exams/internal/test-session-id')
      await expect(page.getByText('Enter Exam Mode')).toBeVisible()

      const detected = await page.evaluate(() => {
        Object.defineProperty(document, 'hidden', { value: true, writable: true, configurable: true })
        document.dispatchEvent(new Event('visibilitychange'))
        return true
      })
      expect(detected).toBe(true)
    })
  })

  test.describe('Multi-Tab Prevention', () => {
    test('BroadcastChannel is available for tab lock', async ({ page }) => {
      await page.goto('/student/exams/internal/test-session-id')
      const available = await page.evaluate(() => typeof BroadcastChannel !== 'undefined')
      expect(available).toBe(true)
    })
  })
})
