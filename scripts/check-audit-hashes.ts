import prisma from '@/lib/prisma/client'

async function main() {
  const count = await prisma.auditLog.count()
  const hashes = await prisma.auditLog.count({ where: { entryHash: { not: null } } })
  console.log('Total audit logs:', count)
  console.log('With entryHash:', hashes)
  await prisma.$disconnect()
}

main().catch(console.error)



