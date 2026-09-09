/**
 * Email registry — admin-curated list of every email address the application
 * uses (auto-senders) plus any custom entries the admin wants to track.
 *
 * The AUTO entries are seeded from `EMAIL_ADDRESSES` (in `business-rules.ts`)
 * and from the inventory below. They ARE editable via the UI — admin edits to
 * the title, description, or address are preserved across seed runs. The seed
 * only ensures the entry exists; it never overrides an admin-customized address.
 * CUSTOM entries are fully admin-managed and can be added/deleted freely.
 *
 * The `key` field on each inventory entry provides a stable identifier for
 * code lookups (`getRegistryFromAddress`), so senders can resolve the correct
 * address even when an admin has customized the title or address.
 */

import 'server-only'
import { unstable_cache, revalidateTag } from 'next/cache'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { EMAIL_ADDRESSES } from '@/lib/constants/business-rules'

/** Cache tag used to invalidate the email-registry lookup cache. */
export const EMAIL_REGISTRY_CACHE_TAG = 'email-registry'

export interface SystemEntry {
  /** Stable identifier for code-driven lookups (never shown in UI). */
  key: string
  title: string
  description: string
  address: string
}

/**
 * Every auto-sending address used by the application. Keep this in sync
 * when adding a new outbound email path so it shows up on the registry tab.
 *
 * The `key` values are used by `getRegistryFromAddress()` — they MUST be
 * stable and never change, even if the human-readable title does.
 */
export const SYSTEM_EMAIL_INVENTORY: SystemEntry[] = [
  {
    key: 'transactional_sender',
    title: 'Transactional sender',
    description:
      'Default `from:` for student/applicant/instructor emails (welcome, verification, password reset, exam booking, certificate release). Used by `lib/email/sender.ts` and `lib/email/service.ts`.',
    address: EMAIL_ADDRESSES.fromTransactional,
  },
  {
    key: 'noreply_system',
    title: 'No-reply system',
    description:
      'Used for nightly database backups, cron-driven notifications, and contact-form auto-acknowledgements. Sent from `lib/backup.ts` and `app/api/public/contact/route.ts`.',
    address: EMAIL_ADDRESSES.fromNoReply,
  },
  {
    key: 'admissions_inbox',
    title: 'Admissions inbox',
    description:
      'Public contact point for prospective students. Forms on the marketing site route here. Shown on the public footer.',
    address: EMAIL_ADDRESSES.admissions,
  },
  {
    key: 'support_inbox',
    title: 'Support inbox',
    description:
      'Customer-support address shown in transactional email footers. Replies from students land here.',
    address: EMAIL_ADDRESSES.support,
  },
  {
    key: 'contact_form_recipient',
    title: 'Contact form recipient',
    description:
      'Inbox that receives public contact-form submissions (`app/api/public/contact/route.ts`).',
    address: 'trainingprograms@aerojet-academy.com',
  },
]

/** Look up the canonical (code-defined) address for a given system key. */
export function getSystemEmail(key: string): SystemEntry | undefined {
  return SYSTEM_EMAIL_INVENTORY.find((e) => e.key === key)
}

/** Idempotent seed of the AUTO entries. Creates new entries, re-tags existing
 *  ones as AUTO/system, and preserves any admin customizations.
 *
 *  Matching strategy (in order):
 *  1. By canonical address — the entry already sits at the code-defined
 *     address; just re-tag it. All admin edits (title, description, address
 *     if the admin hasn't changed it) are naturally preserved.
 *  2. By canonical title (any category) — an admin previously edited this
 *     entry's address away from the canonical one. Re-tag as AUTO/system
 *     but KEEP the admin's custom address; never override it.
 *  3. Create a brand-new entry with canonical values.
 *
 *  This ensures admin-edited communication emails are never silently
 *  reverted or duplicated on subsequent visits to the comms tab. */
export async function seedSystemEmailRegistry() {
  for (const entry of SYSTEM_EMAIL_INVENTORY) {
    // 1. Look up by the canonical address first
    const byAddress = await prismaUnfiltered.emailRegistryEntry.findUnique({
      where: { address: entry.address },
    })
    if (byAddress) {
      // Entry exists at the correct address — just re-tag, preserve all edits
      await prismaUnfiltered.emailRegistryEntry.update({
        where: { address: entry.address },
        data: { category: 'AUTO', isSystem: true },
      })
      continue
    }

    // 2. No entry at this address. Look for one with the same title that may
    //    have been customized by an admin (address changed). Match ANY category
    //    so we don't orphan the admin's edit and don't create a duplicate.
    const byTitle = await prismaUnfiltered.emailRegistryEntry.findFirst({
      where: { title: entry.title },
    })
    if (byTitle) {
      // Re-tag as AUTO/system but PRESERVE the admin's custom address.
      // We deliberately do NOT override address, title, or description here.
      await prismaUnfiltered.emailRegistryEntry.update({
        where: { id: byTitle.id },
        data: { category: 'AUTO', isSystem: true },
      })
      continue
    }

    // 3. No existing entry at all — create it with canonical values
    await prismaUnfiltered.emailRegistryEntry.create({
      data: {
        title: entry.title,
        description: entry.description,
        address: entry.address,
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

/**
 * Resolve the live `from` address for a system email by its stable key
 * (e.g. `'transactional_sender'`, `'noreply_system'`).
 *
 * Looks up the email registry for an AUTO entry with the matching title.
 * If an admin has customized the address, that address is returned.
 * If no registry entry exists (or the admin renamed the title), the
 * canonical code-defined address from `SYSTEM_EMAIL_INVENTORY` is used
 * as a safe fallback.
 *
 * Results are cached for 5 minutes and invalidated via
 * `invalidateEmailRegistryCache()` whenever the registry is edited.
 */
export async function getRegistryFromAddress(key: string): Promise<string | null> {
  const canonical = SYSTEM_EMAIL_INVENTORY.find((e) => e.key === key)
  if (!canonical) return null

  return unstable_cache(
    async () => {
      const entry = await prismaUnfiltered.emailRegistryEntry.findFirst({
        where: { title: canonical.title, category: 'AUTO' },
        select: { address: true },
      })
      // Admin-customized address takes priority; fall back to code default
      return entry?.address ?? canonical.address
    },
    [`email-registry:from:${key}`],
    { revalidate: 300, tags: [EMAIL_REGISTRY_CACHE_TAG] }
  )()
}

/** Invalidate the email-registry cache so the next lookup picks up edits. */
export function invalidateEmailRegistryCache() {
  revalidateTag(EMAIL_REGISTRY_CACHE_TAG, 'max')
}

/** Result of a duplicate-cleanup pass. */
export interface DuplicatesCleanupResult {
  removed: number
  details: Array<{ title: string; address: string; keptAddress: string }>
}

/**
 * Find and remove duplicate AUTO entries that the old seed behaviour created.
 *
 * A "duplicate" is any title that has more than one AUTO entry. This happens
 * when an admin edited an AUTO entry's address (before the seed was fixed to
 * preserve customizations) — the seed would create a new entry at the canonical
 * address while the admin's entry remained.
 *
 * Strategy per duplicate group:
 * - If one entry has a non-canonical address (admin-customized), keep it and
 *   remove the canonical duplicate.
 * - If all entries share the canonical address, keep the most-recently
 *   updated and remove the rest.
 *
 * The caller is responsible for audit-logging. This function only deletes
 * rows and busts the cache.
 */
export async function cleanupDuplicateRegistryEntries(): Promise<DuplicatesCleanupResult> {
  const all = await prismaUnfiltered.emailRegistryEntry.findMany({
    where: { category: 'AUTO' },
    orderBy: [{ title: 'asc' }, { updatedAt: 'desc' }],
  })

  const groups = new Map<string, typeof all>()
  for (const entry of all) {
    const group = groups.get(entry.title) ?? []
    group.push(entry)
    groups.set(entry.title, group)
  }

  const details: DuplicatesCleanupResult['details'] = []
  let removed = 0

  for (const group of groups.values()) {
    if (group.length <= 1) continue

    const canonical = SYSTEM_EMAIL_INVENTORY.find((e) => e.title === group[0].title)
    const canonicalAddress = canonical?.address

    // Prefer keeping the entry with a non-canonical (admin-customized) address
    let keeper = canonicalAddress ? group.find((e) => e.address !== canonicalAddress) : undefined
    // Fallback: keep the most recently updated (group is ordered by updatedAt desc)
    if (!keeper) keeper = group[0]

    for (const entry of group) {
      if (entry.id === keeper!.id) continue
      await prismaUnfiltered.emailRegistryEntry.delete({ where: { id: entry.id } })
      removed++
      details.push({
        title: entry.title,
        address: entry.address,
        keptAddress: keeper!.address,
      })
    }
  }

  if (removed > 0) invalidateEmailRegistryCache()
  return { removed, details }
}
