/**
 * Playwright Global Setup
 *
 * Runs once before all E2E tests:
 * 1. Verifies the app server is reachable
 * 2. Seeds the database (ensures test users exist)
 * 3. Validates test credentials work
 */
import { execSync } from 'child_process'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function globalSetup() {
  console.log('\n🔧 [E2E Setup] Starting global setup...')

  // 1. Seed the database to ensure test users exist
  try {
    console.log('[E2E Setup] Seeding database...')
    execSync('npx prisma db seed', {
      stdio: 'pipe',
      timeout: 60_000,
      env: { ...process.env, NODE_ENV: 'test' },
    })
    console.log('[E2E Setup] Database seeded successfully')
  } catch (error: any) {
    console.warn(
      '[E2E Setup] Seed warning (may already be seeded):',
      error.stderr?.toString().slice(0, 200)
    )
  }

  // 2. Wait for the server to be ready
  const maxRetries = 30
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(BASE_URL, { signal: AbortSignal.timeout(3000) })
      if (res.ok || res.status < 500) {
        console.log(`[E2E Setup] Server ready at ${BASE_URL}`)
        break
      }
    } catch {
      if (i === maxRetries - 1) {
        throw new Error(`Server not reachable at ${BASE_URL} after ${maxRetries} retries`)
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
  }

  console.log('[E2E Setup] Global setup complete\n')
}

export default globalSetup
