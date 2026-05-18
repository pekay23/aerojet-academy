/**
 * Playwright Global Teardown
 *
 * Runs once after all E2E tests complete.
 * Cleans up test artifacts created during the test run.
 */

async function globalTeardown() {
  console.log('\n🧹 [E2E Teardown] Cleaning up...')

  // Test users created by seed are preserved for future runs.
  // Only clean up transient test data (e.g., bookings created during tests).
  //
  // If tests create ephemeral data (pool memberships, payments, etc.),
  // add cleanup queries here using a Prisma client:
  //
  //   const { PrismaClient } = await import('@prisma/client')
  //   const prisma = new PrismaClient()
  //   await prisma.poolMembership.deleteMany({ where: { userId: { startsWith: 'test-' } } })
  //   await prisma.$disconnect()

  console.log('[E2E Teardown] Complete\n')
}

export default globalTeardown
