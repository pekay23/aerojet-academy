import { prismaUnfiltered } from '@/lib/prisma/client'

async function main() {
  try {
    const result = await prismaUnfiltered.$queryRaw<any[]>`
      SELECT column_name::text, data_type::text FROM information_schema.columns WHERE table_name = 'audit_logs' ORDER BY ordinal_position
    `
    console.log('All audit_logs columns:')
    result.forEach((col: any) => console.log(`  ${col.column_name} (${col.data_type})`))
  } catch (e: any) {
    console.log('Error:', e.message)
  }
  await prismaUnfiltered.$disconnect()
}

main()
