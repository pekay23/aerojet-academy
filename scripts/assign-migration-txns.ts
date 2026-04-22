import prisma from '../lib/prisma/client'

async function assignMigrationTxns() {
  // Find the super admin or admin
  let superAdmin = await prisma.user.findFirst({
    where: { role: 'SUPER_ADMIN' },
    select: { id: true, email: true },
    orderBy: { createdAt: 'asc' }
  })

  if (!superAdmin) {
    superAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { id: true, email: true },
      orderBy: { createdAt: 'asc' }
    })
  }

  if (!superAdmin) {
    console.error('No ADMIN or SUPER_ADMIN found in the database.')
    process.exit(1)
  }

  console.log(`Found Admin User to credit: ${superAdmin.email}`)

  // Update migration txns
  const updated = await prisma.walletTransaction.updateMany({
    where: {
      createdBy: null,
      type: { in: ['TOP_UP', 'CREDIT'] },
      referenceType: 'migration'
    },
    data: {
      createdBy: superAdmin.id
    }
  })

  // Let's also update any other historical top-ups without an owner just in case
  const updatedOthers = await prisma.walletTransaction.updateMany({
    where: {
      createdBy: null,
      type: { in: ['TOP_UP', 'CREDIT'] }
    },
    data: {
      createdBy: superAdmin.id
    }
  })

  console.log(`✅ Assigned ${updated.count} migration transactions and ${updatedOthers.count} other orphaned transactions to ${superAdmin.email}.`)

  await prisma.$disconnect()
}

assignMigrationTxns().catch(e => {
  console.error(e)
  process.exit(1)
})
