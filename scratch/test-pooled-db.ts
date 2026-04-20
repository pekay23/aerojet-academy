import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { neonConfig } from '@neondatabase/serverless'
import ws from 'ws'
import 'dotenv/config'

neonConfig.webSocketConstructor = ws

async function testConnection() {
  const connectionString = process.env.DATABASE_URL
  console.log('Testing connection to:', connectionString?.replace(/:([^:@]+)@/, ':****@'))
  
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: connectionString! }),
  })

  try {
    const result = await prisma.systemSetting.findFirst()
    console.log('✅ Connection successful. SystemSetting:', result)
  } catch (error) {
    console.error('❌ Connection failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
