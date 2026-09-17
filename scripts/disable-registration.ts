import { prismaUnfiltered as prisma } from '../lib/prisma/client'

async function main() {
  console.log('Setting registration_open to false...')
  await prisma.systemSetting.upsert({
    where: { key: 'registration_open' },
    update: { value: 'false' },
    create: { key: 'registration_open', value: 'false', type: 'BOOLEAN' },
  })
  console.log('Successfully set registration_open to false.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    // Cannot disconnect extended client directly, but process exit handles it.
    process.exit(0)
  })


