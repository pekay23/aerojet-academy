import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'

// server-only, next/cache, and @/lib/prisma/client are already mocked in setup.ts.
// prismaMock.emailRegistryEntry is auto-created via the Proxy in setup.ts.

import {
  seedSystemEmailRegistry,
  getRegistryFromAddress,
  cleanupDuplicateRegistryEntries,
  SYSTEM_EMAIL_INVENTORY,
} from '@/lib/email/registry'

const reg = () => prismaMock.emailRegistryEntry

describe('Email registry seed', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('seedSystemEmailRegistry', () => {
    it('creates AUTO entries with canonical values when none exist', async () => {
      reg().findUnique.mockResolvedValue(null)
      reg().findFirst.mockResolvedValue(null)
      reg().create.mockResolvedValue({ id: 'new-1' })

      await seedSystemEmailRegistry()

      expect(reg().findUnique).toHaveBeenCalledTimes(SYSTEM_EMAIL_INVENTORY.length)
      expect(reg().create).toHaveBeenCalledTimes(SYSTEM_EMAIL_INVENTORY.length)
      const created = reg().create.mock.calls[0][0]
      expect(created.data.category).toBe('AUTO')
      expect(created.data.isSystem).toBe(true)
    })

    it('preserves admin-edited address when entry exists at a custom address', async () => {
      // Simulate: admin changed "Transactional sender" from
      // 'Aerojet Academy <admissions@aerojet-academy.com>' to
      // 'Aerojet Academy <news@company.com>'
      const canonical = SYSTEM_EMAIL_INVENTORY[0]
      reg().findUnique.mockResolvedValue(null) // not found by canonical address
      // First findFirst call (for "Transactional sender") returns the
      // admin-customized entry; subsequent calls (other entries) return null
      reg()
        .findFirst.mockResolvedValueOnce({
          id: 'entry-1',
          title: canonical.title,
          address: 'Aerojet Academy <news@company.com>',
          category: 'AUTO',
          isSystem: true,
        })
        .mockResolvedValue(null)
      reg().update.mockResolvedValue({})
      reg().create.mockResolvedValue({ id: 'new' })

      await seedSystemEmailRegistry()

      // Should NOT create a duplicate at the canonical address for the
      // first entry (it was found by title); but WILL create for entries
      // not yet in the DB
      // Should re-tag by id, NOT override the address
      const updateCall = reg().update.mock.calls[0]
      expect(updateCall[0].where).toEqual({ id: 'entry-1' })
      expect(updateCall[0].data).toEqual({ category: 'AUTO', isSystem: true })
      expect(updateCall[0].data).not.toHaveProperty('address')
      expect(updateCall[0].data).not.toHaveProperty('title')
      expect(updateCall[0].data).not.toHaveProperty('description')
    })

    it('re-tags existing entries without overriding admin edits to title/description', async () => {
      const canonical = SYSTEM_EMAIL_INVENTORY[0]
      reg().findUnique.mockResolvedValue({
        id: 'existing-1',
        title: 'Custom Title by Admin',
        address: canonical.address,
        description: 'Admin description',
        category: 'AUTO',
        isSystem: true,
      })
      reg().update.mockResolvedValue({})

      await seedSystemEmailRegistry()

      // Should only update category/isSystem — preserve title and description
      const updateCall = reg().update.mock.calls[0]
      expect(updateCall[0].data).toEqual({ category: 'AUTO', isSystem: true })
      expect(updateCall[0].data).not.toHaveProperty('title')
      expect(updateCall[0].data).not.toHaveProperty('description')
      expect(updateCall[0].data).not.toHaveProperty('address')
    })
  })

  describe('getRegistryFromAddress', () => {
    it('returns the admin-customized address when one exists in the registry', async () => {
      reg().findFirst.mockResolvedValue({
        address: 'Aerojet Academy <news@company.com>',
      })

      const result = await getRegistryFromAddress('transactional_sender')

      expect(result).toBe('Aerojet Academy <news@company.com>')
      expect(reg().findFirst).toHaveBeenCalledWith({
        where: { title: 'Transactional sender', category: 'AUTO' },
        select: { address: true },
      })
    })

    it('falls back to the canonical code address when no registry entry exists', async () => {
      reg().findFirst.mockResolvedValue(null)

      const result = await getRegistryFromAddress('transactional_sender')
      const canonical = SYSTEM_EMAIL_INVENTORY[0]
      expect(result).toBe(canonical.address)
    })

    it('returns null for an unknown key', async () => {
      const result = await getRegistryFromAddress('nonexistent_key')
      expect(result).toBeNull()
    })

    it('returns the noreply address for the noreply_system key', async () => {
      const canonical = SYSTEM_EMAIL_INVENTORY.find((e) => e.key === 'noreply_system')!
      reg().findFirst.mockResolvedValueOnce(null)

      const result = await getRegistryFromAddress('noreply_system')
      expect(result).toBe(canonical.address)
    })
  })

  describe('cleanupDuplicateRegistryEntries', () => {
    it('removes duplicate AUTO entries by title, keeping the customized address', async () => {
      const canonical = SYSTEM_EMAIL_INVENTORY[0]
      reg().findMany.mockResolvedValue([
        {
          id: 'dup-1',
          title: canonical.title,
          address: canonical.address,
          updatedAt: new Date('2026-01-02'),
        },
        {
          id: 'custom-1',
          title: canonical.title,
          address: 'Aerojet Academy <news@company.com>',
          updatedAt: new Date('2026-01-03'),
        },
      ])
      reg().delete.mockResolvedValue({})

      const result = await cleanupDuplicateRegistryEntries()

      expect(result.removed).toBe(1)
      expect(result.details[0].title).toBe(canonical.title)
      expect(result.details[0].address).toBe(canonical.address)
      expect(reg().delete).toHaveBeenCalledWith({ where: { id: 'dup-1' } })
    })

    it('removes duplicates when all share the canonical address, keeping the most recent', async () => {
      const canonical = SYSTEM_EMAIL_INVENTORY[0]
      // Mock returns results in DB-sorted order (updatedAt desc — most recent first)
      reg().findMany.mockResolvedValue([
        {
          id: 'newer',
          title: canonical.title,
          address: canonical.address,
          updatedAt: new Date('2026-01-02'),
        },
        {
          id: 'old',
          title: canonical.title,
          address: canonical.address,
          updatedAt: new Date('2026-01-01'),
        },
      ])
      reg().delete.mockResolvedValue({})

      const result = await cleanupDuplicateRegistryEntries()

      expect(result.removed).toBe(1)
      expect(reg().delete).toHaveBeenCalledWith({ where: { id: 'old' } })
    })

    it('returns removed=0 when there are no duplicates', async () => {
      const canonical = SYSTEM_EMAIL_INVENTORY[0]
      reg().findMany.mockResolvedValue([
        { id: 'only', title: canonical.title, address: canonical.address, updatedAt: new Date() },
      ])

      const result = await cleanupDuplicateRegistryEntries()

      expect(result.removed).toBe(0)
      expect(result.details).toEqual([])
      expect(reg().delete).not.toHaveBeenCalled()
    })
  })
})
