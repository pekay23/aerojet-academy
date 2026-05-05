import { prismaBase as prisma } from '../../../lib/prisma/db-base'
import bcrypt from 'bcryptjs'

async function main() {
  const email = 'admin@aerojet-academy.com'
  const password = 'Admin@2026'
  console.log(`Checking/Creating admin: ${email}`)
  
  const adminPassword = await bcrypt.hash(password, 12)
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: adminPassword,
      status: 'ACTIVE',
      role: 'ADMIN'
    },
    create: {
      email,
      academyEmail: email,
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      profile: {
        create: {
          firstName: 'Admin',
          lastName: 'User',
          nationality: 'Ghanaian'
        }
      }
    }
  })
  
  console.log('Admin user updated/created:', user.email)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
