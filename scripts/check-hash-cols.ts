import { prismaUnfiltered } from '@/lib/prisma/client'

async function main() {
  try {
    const result = await prismaUnfiltered.$queryRaw<any[]>`
      SELECT quote_ident(column_name) AS col FROM information_schema.columns WHERE table_name = 'audit_logs' AND column_name LIKE '%hash%' ORDER BY ordinal_position
    `
    console.log('Hash columns (quoted):', result)
  } catch (e: any) {
    console.log('Error:', e.message)
  }
  await prismaUnfiltered.$disconnect()
}

main()
