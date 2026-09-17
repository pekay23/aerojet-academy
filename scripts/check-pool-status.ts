#!/usr/bin/env tsx
/**
 * Check and report on all exam pool statuses
 * Usage: npx tsx scripts/check-pool-status.ts
 */
import { PrismaClient } from '@prisma/client'
import { differenceInDays, format } from 'date-fns'

const prisma = new PrismaClient()

async function main() {
  const pools = await prisma.examPool.findMany({
    include: { event: true, _count: { select: { memberships: true } } },
    orderBy: { examDate: 'asc' },
  })

  console.log(`\n📊 Pool Status Report (${pools.length} total)\n`)
  console.log('Status     | Name                        | Date       | Members | Days Left')
  console.log('-'.repeat(80))

  for (const pool of pools) {
    const daysLeft = differenceInDays(pool.examDate, new Date())
    const dateStr = format(pool.examDate, 'dd MMM yyyy')
    const status = pool.status.padEnd(10)
    const name = pool.name.substring(0, 27).padEnd(27)
    const members = `${pool.currentMemberCount}/28`.padEnd(7)
    const days = daysLeft >= 0 ? `${daysLeft}d` : `PAST`

    console.log(`${status} | ${name} | ${dateStr} | ${members} | ${days}`)
  }

  const open = pools.filter((p) => ['OPEN', 'NEAR_FULL'].includes(p.status))
  const atRisk = open.filter((p) => differenceInDays(p.examDate, new Date()) <= 21 && p.currentMemberCount < 25)

  if (atRisk.length > 0) {
    console.log(`\n⚠️  ${atRisk.length} pool(s) at risk of failing (< 25 members, deadline within 21 days)`)
    atRisk.forEach((p) => console.log(`   - ${p.name}: ${p.currentMemberCount}/25`))
  }
}

main()
  .catch((e) => { console.error('❌ Failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())



