import { prismaUnfiltered as prisma } from '../lib/prisma/client'
import { BookingType, PaymentStatus } from '@prisma/client'

const FUNDED_STUDENTS = [
  { name: 'Bernard Bandor', email: 'b.bandor@aerojet-academy.com', modules: ['M1', 'M2', 'M3', 'M8'], type: 'FOUR_PACK', cost: 1340 },
  { name: 'Abdul Wahab Adam', email: 'a.adam@aerojet-academy.com', modules: ['M1', 'M2', 'M3', 'M8'], type: 'FOUR_PACK', cost: 1340 },
]

async function main() {
  console.log('💳 Processing funded bookings for Bernard and Abdul (20s timeout)...')

  for (const item of FUNDED_STUDENTS) {
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ 
          where: { email: item.email },
          include: { wallet: true }
        })

        if (!user || !user.wallet) throw new Error(`User or wallet not found for ${item.email}`)
        
        if (Number(user.wallet.availableBalance) < item.cost) {
          throw new Error(`Insufficient funds for ${item.email}: Has ${user.wallet.availableBalance}, needs ${item.cost}`)
        }

        const groupRef = `BOOKING_FUNDED_${Date.now()}`
        console.log(`  [${item.name}] Deducting €${item.cost} and creating ${item.modules.length} bookings...`)

        // 1. Deduct funds
        await tx.wallet.update({
          where: { id: user.wallet.id },
          data: { 
            availableBalance: { decrement: item.cost },
            balance: { decrement: item.cost }
          }
        })

        // 2. Record Transaction
        const transaction = await tx.walletTransaction.create({
          data: {
            walletId: user.wallet.id,
            type: 'DEBIT',
            amount: item.cost,
            description: `Payment for ${item.type}: ${item.modules.join(', ')}`,
            referenceType: 'SEEDED_EXAM_BOOKING',
            referenceId: groupRef,
            metadata: { groupRef, packType: item.type }
          }
        })

        // 3. Create Bookings
        for (const moduleCode of item.modules) {
          await tx.examBooking.create({
            data: {
              userId: user.id,
              moduleCode,
              bookingType: item.type as BookingType,
              status: PaymentStatus.APPROVED,
              examDate: new Date('2026-06-15'),
              amountPaid: item.cost / item.modules.length,
              bookingGroupRef: groupRef,
              walletTxnId: transaction.id
            }
          })
        }
      }, { timeout: 20000 })
      console.log(`  ✅ Successfully processed ${item.name}`)
    } catch (error: any) {
      console.error(`  ❌ Failed to process ${item.email}: ${error.message}`)
    }
  }
  console.log('✨ All funded bookings processed.')
}

main().finally(() => prisma.$disconnect())
