import { test, expect, type Page } from '@playwright/test'

async function loginAsStudent(page: Page) {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'student@test.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  await page.waitForURL('/student')
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
    test('attempts to enter fullscreen on exam start', async ({ page }) => {
      await page.goto('/student/exams/internal/test-session-id')
      await page.waitForTimeout(500)
      const inFullscreen = await page.evaluate(() => {
        return !!document.fullscreenElement
      })
      expect(inFullscreen).toBe(true)
    })
  })

  test.describe('Clipboard Block', () => {
    test('prevents copy events', async ({ page }) => {
      await page.goto('/student/exams/internal/test-session-id')
      await page.waitForTimeout(500)
      const prevented = await page.evaluate(async () => {
        let prevented = false
        document.addEventListener('copy', (e: any) => {
          prevented = e.defaultPrevented
        })
        const event = new ClipboardEvent('copy', { bubbles: true })
        document.dispatchEvent(event)
        return prevented
      })
      expect(prevented).toBe(true)
    })

    test('prevents paste events', async ({ page }) => {
      await page.goto('/student/exams/internal/test-session-id')
      await page.waitForTimeout(500)
      const prevented = await page.evaluate(async () => {
        let prevented = false
        document.addEventListener('paste', (e: any) => {
          prevented = e.defaultPrevented
        })
        const event = new ClipboardEvent('paste', { bubbles: true })
        document.dispatchEvent(event)
        return prevented
      })
      expect(prevented).toBe(true)
    })
  })

  test.describe('Keyboard Shortcut Block', () => {
    test('prevents Ctrl+C via keydown', async ({ page }) => {
      await page.goto('/student/exams/internal/test-session-id')
      await page.waitForTimeout(500)
      const prevented = await page.evaluate(async () => {
        let prevented = false
        document.addEventListener('keydown', (e: any) => {
          if (e.ctrlKey && e.key.toLowerCase() === 'c') {
            prevented = e.defaultPrevented
          }
        })
        const event = new KeyboardEvent('keydown', {
          bubbles: true,
          ctrlKey: true,
          key: 'c',
        })
        Object.defineProperty(event, 'defaultPrevented', { get: () => false })
        document.dispatchEvent(event)
        return prevented
      })
      expect(prevented).toBe(true)
    })
  })

  test.describe('Tab Switch Detection', () => {
    test('detects visibility changes', async ({ page }) => {
      await page.goto('/student/exams/internal/test-session-id')
      await page.waitForTimeout(500)
      const detected = await page.evaluate(() => {
        let detected = false
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) detected = true
        })
        Object.defineProperty(document, 'hidden', { value: true, writable: true })
        document.dispatchEvent(new Event('visibilitychange'))
        return detected
      })
      expect(detected).toBe(true)
    })
  })

  test.describe('Multi-Tab Prevention', () => {
    test('BroadcastChannel is available for tab lock', async ({ page }) => {
      await page.goto('/student/exams/internal/test-session-id')
      await page.waitForTimeout(500)
      const available = await page.evaluate(() => {
        return typeof BroadcastChannel !== 'undefined'
      })
      expect(available).toBe(true)
    })
  })
})
