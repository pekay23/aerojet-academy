import dotenv from 'dotenv'
import path from 'node:path'

const envDir = path.resolve(process.cwd())
dotenv.config({ path: path.join(envDir, '.env') })
dotenv.config({ path: path.join(envDir, '.env.local'), override: false })

console.log('DATABASE_URL set:', Boolean(process.env.DATABASE_URL))
console.log(
  'Host:',
  process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL.replace('postgresql://', 'http://')).hostname : 'N/A'
)

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({ log: ['error'] })

try {
  await prisma.$connect()
  console.log('CONNECTION: OK')
  const count = await prisma.user.count()
  console.log('User count:', count)
  await prisma.$disconnect()
  process.exit(0)
} catch (e) {
  console.error('FAILED:', (e as Error).message.slice(0, 300))
  await prisma.$disconnect()
  process.exit(1)
}