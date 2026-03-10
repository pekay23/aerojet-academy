import prisma from './lib/prisma/client'

const emails = [
  'davarcher111@gmail.com',
  'd.archer@aerojet-academy.com',
  'adamwahab160@gmail.com',
  'a.adam@aerojet-academy.com',
  'stanleykdzator@gmail.com',
  'd.korku@aerojet-academy.com',
  'fredampeh@gmail.com',
  'f.ampeh@aerojet-academy.com',
  'benardbandor@gmail.com',
  'b.bandor@aerojet-academy.com',
  'puredzifa1@gmail.com',
  'e.avege@aerojet-academy.com',
  'prince.wiafegh@gmail.com',
  'p.wiafe@aerojet-academy.com',
  'odurokwarteng028@gmail.com',
  'e.kwarteng@aerojet-academy.com',
]

async function verify() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { in: emails } },
        { personalEmail: { in: emails } },
        { academyEmail: { in: emails } },
      ],
    },
    include: {
      profile: true,
      wallet: true,
      studentProfile: true,
      examBookings: true,
      bookingEntitlements: true,
    },
  })

  console.log(`Found ${users.length} users.`)
  for (const user of users) {
    console.log(`\nUser: ${user.profile?.firstName} ${user.profile?.lastName} (${user.email})`)
    console.log(`  Status: ${user.status}, mustChangePassword: ${user.mustChangePassword}`)
    console.log(`  Wallet Balance: ${user.wallet?.balance} EUR`)
    console.log(`  Exam Bookings: ${user.examBookings.length}`)
    user.examBookings.forEach((b) => {
      console.log(
        `    - ${b.moduleCode}: ${b.result} (${b.attemptType}) [${b.status}] ref: ${b.bookingGroupRef}`
      )
    })
    console.log(`  Entitlements: ${user.bookingEntitlements.length}`)
    user.bookingEntitlements.forEach((e) => {
      console.log(`    - ${e.bookingGroupRef}: used ${e.usedFreeResits}/${e.includedFreeResits}`)
    })
  }
}

verify()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
