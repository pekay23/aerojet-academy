#!/usr/bin/env tsx
/**
 * Export data to JSON for backup
 * Usage: npx tsx scripts/export-data.ts [entity]
 * Entities: users, students, enrollments, payments, pools
 */
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const entity = process.argv[2] || 'all'
const outputDir = path.join(process.cwd(), 'exports')

async function main() {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')

  const exporters: Record<string, () => Promise<any[]>> = {
    users: () => prisma.user.findMany({ include: { profile: true }, orderBy: { createdAt: 'asc' } }),
    students: () => prisma.user.findMany({ where: { role: 'STUDENT' }, include: { profile: true, studentProfile: true, wallet: true } }),
    enrollments: () => prisma.enrollment.findMany({ include: { user: { include: { profile: true } }, course: true } }),
    payments: () => prisma.payment.findMany({ include: { user: { include: { profile: true } } }, orderBy: { createdAt: 'desc' } }),
    pools: () => prisma.examPool.findMany({ include: { memberships: true, event: true } }),
  }

  const toExport = entity === 'all' ? Object.keys(exporters) : [entity]

  for (const name of toExport) {
    if (!exporters[name]) { console.log(`Unknown entity: ${name}`); continue }
    const data = await exporters[name]()
    const file = path.join(outputDir, `${name}-${timestamp}.json`)
    fs.writeFileSync(file, JSON.stringify(data, null, 2))
    console.log(`✅ Exported ${data.length} ${name} → ${file}`)
  }
}

main()
  .catch((e) => { console.error('❌ Export failed:', e); process.exit(1) })
  .finally(() => prisma.$disconnect())
