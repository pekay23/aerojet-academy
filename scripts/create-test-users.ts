// Create remaining test users that the seed script hasn't reached yet
import { prismaUnfiltered } from '@/lib/prisma/client'
import bcrypt from 'bcryptjs'

async function main() {
  // Check existing examiner users
  const existingExaminers = await prismaUnfiltered.user.findMany({
    where: { role: 'EXAMINER' },
    select: { email: true, role: true }
  })
  console.log('Existing examiners:', JSON.stringify(existingExaminers, null, 2))

  // Create Examiner - check the schema first
  const examinerPassword = await bcrypt.hash('Examiner@2026', 12)
  await prismaUnfiltered.user.upsert({
    where: { email: 'examiner@aerojet-academy.com' },
    update: {
      password: examinerPassword,
      status: 'ACTIVE',
      emailVerified: new Date(),
      mustChangePassword: false,
    },
    create: {
      email: 'examiner@aerojet-academy.com',
      academyEmail: 'examiner@aerojet-academy.com',
      password: examinerPassword,
      role: 'EXAMINER',
      emailVerified: new Date(),
      status: 'ACTIVE',
      mustChangePassword: false,
      profile: {
        create: {
          firstName: 'Ernest',
          lastName: 'Boeing',
          phone: '+233200000005',
          nationality: 'Ghanaian',
          country: 'Ghana',
          city: 'Accra',
        },
      },
    },
  })
  console.log('✅ Examiner created: examiner@aerojet-academy.com / Examiner@2026')

  // Also ensure the existing examiner has a known password
  const existingExaminerEmail = existingExaminers[0]?.email
  if (existingExaminerEmail) {
    await prismaUnfiltered.user.update({
      where: { email: existingExaminerEmail },
      data: {
        password: examinerPassword,
        status: 'ACTIVE',
        emailVerified: new Date(),
      },
    })
    console.log(`✅ Updated existing examiner: ${existingExaminerEmail}`)
  }
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prismaUnfiltered.$disconnect())
