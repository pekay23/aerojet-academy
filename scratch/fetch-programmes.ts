import { prismaUnfiltered as prisma } from '../lib/prisma/client'

async function main() {
  const programmes = await prisma.fullTimeProgramme.findMany({
    include: { programmeYears: true }
  })
  console.log(JSON.stringify(programmes, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
