import { prismaUnfiltered as prisma } from '../lib/prisma/client'
import { BookingType, PaymentStatus } from '@prisma/client'

async function main() {
  const email = 'f.ampeh@aerojet-academy.com'
  const cost = 670
  const modules = ['M2', 'M3']

  console.log(`🛠 Fixing Fred Ampeh's account and booking ${modules.join(', ')}...`)

  const user = await prisma.user.findUnique({ 
    where: { email },
    include: { wallet: true }
  })

  if (!user || !user.wallet) return
  const walletId = user.wallet.id

  await prisma.$transaction(async (tx) => {
    // 1. Delete mock memberships
    await tx.poolMembership.deleteMany({ where: { userId: user.id } })

    // 2. Delete mock reserve transactions
    await tx.walletTransaction.deleteMany({ 
        where: { walletId, type: 'RESERVE' } 
    })

    // 3. Reset wallet to historical state (€670 available)
    await tx.wallet.update({
      where: { id: walletId },
      data: { 
        balance: 670,
        availableBalance: 670,
        reservedBalance: 0
      }
    })

    // 4. Apply real booking
    const groupRef = `BOOKING_FUNDED_FIXED_${Date.now()}`
    
    await tx.wallet.update({
      where: { id: walletId },
      data: { 
        availableBalance: { decrement: cost },
        balance: { decrement: cost }
      }
    })

    await tx.walletTransaction.create({
      data: {
        walletId,
        type: 'DEBIT',
        amount: cost,
        description: `Payment for TWIN_PACK: ${modules.join(', ')} (Restored from roadmap)`,
        metadata: { groupRef, packType: 'TWIN_PACK' }
      }
    })

    for (const moduleCode of modules) {
      await tx.examBooking.create({
        data: {
          userId: user.id,
          moduleCode,
          bookingType: 'TWIN_PACK',
          status: PaymentStatus.APPROVED,
          examDate: new Date('2026-06-15'),
          amountPaid: cost / modules.length,
          bookingGroupRef: groupRef
        }
      })
    }
  }, { timeout: 20000 })

  console.log('✅ Fred Ampeh processed successfully.')
}

main().finally(() => prisma.$disconnect())
