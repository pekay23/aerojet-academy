import prisma from '../lib/prisma/client'

async function checkTopUps() {
  const txns = await prisma.walletTransaction.findMany({
    where: { createdBy: null, type: { in: ['TOP_UP', 'CREDIT'] } },
    include: { wallet: { include: { user: { select: { email: true } } } } }
  })

  console.log(`Found ${txns.length} TOP_UP/CREDIT without a staff (createdBy) attached.`)
  for (const t of txns) {
    console.log(`- ${t.wallet.user.email} | €${t.amount} | ${t.description} | Ref: ${t.referenceType}`)
  }

  await prisma.$disconnect()
}

checkTopUps().catch(e => {
  console.error(e)
  process.exit(1)
})



