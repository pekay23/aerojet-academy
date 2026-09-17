import { prismaUnfiltered } from '@/lib/prisma/client'

async function main() {
  try {
    const result = await prismaUnfiltered.$queryRaw<unknown[]>`
      SELECT column_name::text, data_type::text FROM information_schema.columns WHERE table_name = 'audit_logs' ORDER BY ordinal_position
    `
    console.log('All audit_logs columns:')
    result.forEach((col: unknown) => console.log(`  ${col.column_name} (${col.data_type})`))
  } catch (e: unknown) {
    console.log('Error:', (e as Error).message)
  }
  await prismaUnfiltered.$disconnect()
}

main()




