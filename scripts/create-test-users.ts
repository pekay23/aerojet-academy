// Create remaining test users that the seed script hasn't reached yet
import { prismaUnfiltered } from '@/lib/prisma/client'
import bcrypt from 'bcryptjs'
import { config } from 'dotenv'
config()

async function main() {
  // Check existing examiner users
  const existingExaminers = await prismaUnfiltered.user.findMany({
    where: { role: 'EXAMINER' },
    select: { email: true, role: true },
  })
  console.log('Existing examiners:', JSON.stringify(existingExaminers, null, 2))

  const examinerPassword = process.env.SEED_EXAMINER_PASSWORD || ''
  if (!examinerPassword) {
    console.error('ERROR: SEED_EXAMINER_PASSWORD environment variable is required')
    process.exit(1)
  }

  const hashedPassword = await bcrypt.hash(examinerPassword, 12)

  // Create Examiner - check the schema first
  await prismaUnfiltered.user.upsert({
    where: { email: 'examiner@aerojet-academy.com' },
    update: {
      password: hashedPassword,
      status: 'ACTIVE',
      emailVerified: new Date(),
      mustChangePassword: false,
    },
    create: {
      email: 'examiner@aerojet-academy.com',
      academyEmail: 'examiner@aerojet-academy.com',
      password: hashedPassword,
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
  console.log('✅ Examiner created: examiner@aerojet-academy.com / [password from env]')

  // Also ensure the existing examiner has a known password
  const existingExaminerEmail = existingExaminers[0]?.email
  if (existingExaminerEmail) {
    await prismaUnfiltered.user.update({
      where: { email: existingExaminerEmail },
      data: {
        password: hashedPassword,
        status: 'ACTIVE',
        emailVerified: new Date(),
      },
    })
    console.log(`✅ Updated existing examiner: ${existingExaminerEmail}`)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prismaUnfiltered.$disconnect())
