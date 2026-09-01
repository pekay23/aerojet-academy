import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.SUPABASE_DATABASE_URL || '',
    },
  },
})

async function main() {
  try {
    await prisma.connect()
    console.log('Supabase DB connection: OK')
    const result = (await prisma.queryRaw(
      'SELECT table_name FROM information_schema.tables WHERE table_schema = $1 ORDER BY table_name',
      'public'
    )) as any[]
    console.log('Tables:', result.map(r => r.table_name).join(', '))
  } catch (e: any) {
    console.log('Supabase DB connection FAILED:', e.message)
  } finally {
    await prisma.disconnect()
  }
}

main()
