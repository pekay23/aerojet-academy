import { prismaUnfiltered as prisma } from '../lib/prisma/client'

const INTENT_STUDENTS = [
  { email: 'd.archer@aerojet-academy.com', modules: ['M1', 'M2', 'M3', 'M8'] },
  { email: 'p.wiafe@aerojet-academy.com', modules: ['M2', 'M3'] },
  { email: 'e.kwarteng@aerojet-academy.com', modules: ['M2', 'M3'] },
]

async function main() {
  console.log('🌱 Seeding Academic Intentions for zero-balance students...')

  for (const item of INTENT_STUDENTS) {
    const user = await prisma.user.findUnique({ where: { email: item.email } })
    if (!user) {
        console.log(`  ⚠ User ${item.email} not found. skipping.`)
        continue
    }

    console.log(`  Processing ${item.email}...`)
    
    for (const moduleCode of item.modules) {
      await prisma.academicIntent.create({
        data: {
          userId: user.id,
          moduleCode,
          targetWindow: 'June 2026',
          notes: 'Migrated from historical intention notes.'
        }
      })
    }
  }
  console.log('✨ Intent seeding complete!')
}

main().finally(() => prisma.$disconnect())
