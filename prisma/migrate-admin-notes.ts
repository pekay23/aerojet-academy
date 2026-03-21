/**
 * Migrate Admin Notes to New Model
 *
 * Reads existing adminNotes (plain text) from StudentProfile records
 * and creates AdminNote entries in the new structured model.
 *
 * Run with: npx dotenv-cli -e .env -- tsx prisma/migrate-admin-notes.ts
 */

import prisma from '../lib/prisma/client'

async function main() {
  console.log('=== Migrate Admin Notes to New Model ===\n')

  // Find an ADMIN to use as default author
  const admin = await prisma.user.findFirst({
    where: { role: 'ADMIN', status: 'ACTIVE' },
    select: { id: true, email: true },
  })

  if (!admin) {
    console.error('No active SUPER_ADMIN found. Cannot proceed.')
    process.exit(1)
  }

  console.log(`Using admin: ${admin.email} (${admin.id}) as default author\n`)

  // Find all StudentProfiles with existing adminNotes
  const profiles = await prisma.studentProfile.findMany({
    where: {
      adminNotes: { not: null },
      NOT: { adminNotes: '' },
    },
    select: {
      id: true,
      adminNotes: true,
      updatedAt: true,
      user: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
    },
  })

  console.log(`Found ${profiles.length} profiles with existing notes\n`)

  let migrated = 0
  let skipped = 0

  for (const profile of profiles) {
    const name = profile.user.profile
      ? `${profile.user.profile.firstName} ${profile.user.profile.lastName}`
      : profile.user.email

    // Check if notes already migrated (avoid duplicates)
    const existing = await prisma.adminNote.findFirst({
      where: { studentProfileId: profile.id },
    })

    if (existing) {
      console.log(`  ○ ${name} — already has AdminNote entries, skipping`)
      skipped++
      continue
    }

    await prisma.adminNote.create({
      data: {
        studentProfileId: profile.id,
        content: profile.adminNotes!,
        createdBy: admin.id,
        createdAt: profile.updatedAt,
      },
    })

    console.log(`  ✓ ${name} — migrated: "${profile.adminNotes!.substring(0, 60)}..."`)
    migrated++
  }

  console.log(`\n=== Done: ${migrated} migrated, ${skipped} skipped ===`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  prisma.$disconnect()
  process.exit(1)
})
