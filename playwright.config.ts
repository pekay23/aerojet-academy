import { defineConfig, devices } from '@playwright/test'

const isCI = !!process.env.CI

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup',
  globalTeardown: './tests/e2e/global-teardown',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : 2,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: isCI
    ? [
        // Full cross-browser suite in CI
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
        { name: 'webkit', use: { ...devices['Desktop Safari'] } },
      ]
    : [
        // Chromium only for fast local development runs
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
      ],
  webServer: {
    command: 'npx cross-env NEXTAUTH_URL=http://localhost:3000 bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !isCI,
  },
})
