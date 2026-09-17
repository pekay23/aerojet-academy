import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixPassedField() {
  // Fix records stored as FAIL but percentage >= 75
  const fixedToPass = await prisma.examResult.updateMany({
    where: { percentage: { gte: 75 }, passed: false },
    data: { passed: true },
  })

  // Fix records stored as PASS but percentage < 75
  const fixedToFail = await prisma.examResult.updateMany({
    where: { percentage: { lt: 75 }, passed: true },
    data: { passed: false },
  })

  // Also fix null percentage rows: if percentage is null but passed is wrong,
  // leave them alone (no score = can't determine pass/fail)
  console.log(`✅ Corrected wrong FAIL → PASS: ${fixedToPass.count} records`)
  console.log(`✅ Corrected wrong PASS → FAIL: ${fixedToFail.count} records`)

  await prisma.$disconnect()
}

fixPassedField().catch((e) => {
  console.error('❌ Fix failed:', e)
  process.exit(1)
})


