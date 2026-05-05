import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'

// NO ADAPTER - Use Prisma's native engine
const prisma = new PrismaClient()

async function main() {
  const email = 'admin@aerojet-academy.com'
  const password = process.env.ADMIN_PASSWORD || 'REDACTED_PASSWORD'
  console.log(`Checking/Creating admin (Native Prisma): ${email}`)
  
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
    console.error('Native Prisma failed:', e.message)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
