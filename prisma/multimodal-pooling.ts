import { prismaUnfiltered as prisma } from '../lib/prisma/client'

async function main() {
  console.log('🏗 Creating 4 Multimodal Pools and assigning historical students...')

  const event = await prisma.examEvent.findFirst()
  if (!event) {
      console.log('  ❌ No Exam Event found.')
      return
  }

  const slots = [
    { id: 'pool-15-am', name: 'Pool 1: 2026-06-15 Morning', date: '2026-06-15', time: '09:00' },
    { id: 'pool-15-pm', name: 'Pool 1: 2026-06-15 Afternoon', date: '2026-06-15', time: '13:00' },
    { id: 'pool-16-am', name: 'Pool 1: 2026-06-16 Morning', date: '2026-06-16', time: '09:00' },
    { id: 'pool-16-pm', name: 'Pool 1: 2026-06-16 Afternoon', date: '2026-06-16', time: '13:00' },
  ]

  // 1. Create the Pools with full module flexibility
  const createdPools: Record<string, any> = {}
  for (const s of slots) {
    createdPools[s.id] = await prisma.examPool.upsert({
      where: { id: s.id },
      update: { name: s.name, allowedModules: ['M1', 'M2', 'M3', 'M8'] },
      create: {
        id: s.id,
        eventId: event.id,
        name: s.name,
        examDate: new Date(s.date),
        examStartTime: new Date(`${s.date}T${s.time}:00Z`),
        examEndTime: new Date(`${s.date}T${s.time === '09:00' ? '11:00' : '15:00'}:00Z`),
        status: 'OPEN',
        allowedModules: ['M1', 'M2', 'M3', 'M8'],
        seatPrice: 300,
        maxCandidates: 28
      }
    })
  }

  // 2. Clear old memberships for these students
  const EMAILS = ['b.bandor@aerojet-academy.com', 'a.adam@aerojet-academy.com', 'e.avege@aerojet-academy.com', 'f.ampeh@aerojet-academy.com', 'd.korku@aerojet-academy.com']
  await prisma.poolMembership.deleteMany({ where: { user: { email: { in: EMAILS } } } })

  // 3. Logic-based Assignment (Distributing modules across slots)
  const assignments = [
    { email: 'b.bandor@aerojet-academy.com', sequence: ['M1', 'M2', 'M3', 'M8'] },
    { email: 'a.adam@aerojet-academy.com', sequence: ['M1', 'M2', 'M3', 'M8'] },
    { email: 'e.avege@aerojet-academy.com', sequence: [null, 'M2', 'M3', null] },
    { email: 'f.ampeh@aerojet-academy.com', sequence: [null, 'M2', 'M3', null] },
    { email: 'd.korku@aerojet-academy.com', sequence: ['M1', null, null, 'M8'] },
  ]

  for (const item of assignments) {
    const user = await prisma.user.findUnique({ where: { email: item.email } })
    if (!user) continue

    for (let i = 0; i < item.sequence.length; i++) {
        const moduleCode = item.sequence[i]
        if (!moduleCode) continue

        const booking = await prisma.examBooking.findFirst({
            where: { userId: user.id, moduleCode, status: 'APPROVED' }
        })
        if (!booking) continue

        await prisma.poolMembership.create({
            data: {
                poolId: slots[i].id,
                userId: user.id,
                bookingId: booking.id,
                status: 'CONFIRMED',
                amountReserved: 300,
                amountPaid: 300,
                confirmedAt: new Date()
            }
        })
    }
  }

  // 4. Update Member Counts
  for (const s of slots) {
      const count = await prisma.poolMembership.count({ where: { poolId: s.id } })
      await prisma.examPool.update({ where: { id: s.id }, data: { currentMemberCount: count } })
      console.log(`  ✅ ${s.name} initialized with ${count} students.`)
  }

  console.log('✨ Multimodal pooling complete. Historical students are now fully scheduled.')
}

main().finally(() => prisma.$disconnect())
