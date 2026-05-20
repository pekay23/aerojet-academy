/**
 * Email registry — admin-curated list of every email address the application
 * uses (auto-senders) plus any custom entries the admin wants to track.
 *
 * The AUTO entries are seeded from `EMAIL_ADDRESSES` (in `business-rules.ts`)
 * and from the inventory below. They cannot be edited or deleted via the UI
 * — they always reflect the source of truth in code. CUSTOM entries are
 * fully admin-managed.
 */

import 'server-only'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { EMAIL_ADDRESSES } from '@/lib/constants/business-rules'

interface SystemEntry {
  title: string
  description: string
  address: string
}

/**
 * Every auto-sending address used by the application. Keep this in sync
 * when adding a new outbound email path so it shows up on the registry tab.
 */
export const SYSTEM_EMAIL_INVENTORY: SystemEntry[] = [
  {
    title: 'Transactional sender',
    description:
      'Default `from:` for student/applicant/instructor emails (welcome, verification, password reset, exam booking, certificate release). Used by `lib/email/sender.ts`.',
    address: EMAIL_ADDRESSES.fromTransactional,
  },
  {
    title: 'No-reply / system',
    description:
      'Used for nightly database backups, cron-driven notifications, and contact-form auto-acknowledgements. Sent from `lib/backup.ts` and `app/api/public/contact/route.ts`.',
    address: EMAIL_ADDRESSES.fromNoReply,
  },
  {
    title: 'Admissions inbox',
    description:
      'Public contact point for prospective students. Forms on the marketing site route here. Shown on the public footer.',
    address: EMAIL_ADDRESSES.admissions,
  },
  {
    title: 'Support inbox',
    description:
      'Customer-support address shown in transactional email footers. Replies from students land here.',
    address: EMAIL_ADDRESSES.support,
  },
  {
    title: 'Contact form recipient',
    description:
      'Inbox that receives public contact-form submissions (`app/api/public/contact/route.ts`).',
    address: 'trainingprograms@aerojet-academy.com',
  },
]

/** Idempotent seed of the AUTO entries. Safe to call on every settings load. */
export async function seedSystemEmailRegistry() {
  for (const entry of SYSTEM_EMAIL_INVENTORY) {
    await prismaUnfiltered.emailRegistryEntry.upsert({
      where: { address: entry.address },
      create: {
        title: entry.title,
        description: entry.description,
        address: entry.address,
        category: 'AUTO',
        isSystem: true,
      },
      update: {
        title: entry.title,
        description: entry.description,
        category: 'AUTO',
        isSystem: true,
      },
    })
  }
}

export async function listEmailRegistry() {
  return prismaUnfiltered.emailRegistryEntry.findMany({
    orderBy: [{ category: 'asc' }, { title: 'asc' }],
  })
}
