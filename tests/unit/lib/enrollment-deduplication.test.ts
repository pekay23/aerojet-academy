import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prismaMock } from '@/tests/setup'
import { getDeduplicatedModulesForStudent, getRequiredModulesForLicenses } from '@/lib/enrollment/deduplication'

describe('getDeduplicatedModulesForStudent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns unique modules across multiple license categories', async () => {
    prismaMock.studentLicenseTarget.findMany.mockResolvedValue([
      {
        studentProfileId: 'sp-1',
        licenseCategory: {
          id: 'lc-1',
          requirements: [
            { course: { id: 'c1', name: 'Module A', price: 1000, currency: 'EUR' } },
            { course: { id: 'c2', name: 'Module B', price: 2000, currency: 'EUR' } },
          ],
        },
      },
      {
        studentProfileId: 'sp-1',
        licenseCategory: {
          id: 'lc-2',
          requirements: [
            { course: { id: 'c2', name: 'Module B', price: 2000, currency: 'EUR' } },
            { course: { id: 'c3', name: 'Module C', price: 3000, currency: 'EUR' } },
          ],
        },
      },
    ])

    const result = await getDeduplicatedModulesForStudent('sp-1')

    expect(result.modules).toHaveLength(3)
    expect(result.modules.map(m => m.id)).toEqual(['c1', 'c2', 'c3'])
    expect(result.totalPrice).toBe(6000)
    expect(result.currency).toBe('EUR')
  })

  it('returns empty set when student has no license targets', async () => {
    prismaMock.studentLicenseTarget.findMany.mockResolvedValue([])

    const result = await getDeduplicatedModulesForStudent('sp-1')

    expect(result.modules).toHaveLength(0)
    expect(result.totalPrice).toBe(0)
    expect(result.currency).toBe('EUR')
  })

  it('handles license categories with no requirements', async () => {
    prismaMock.studentLicenseTarget.findMany.mockResolvedValue([
      {
        studentProfileId: 'sp-1',
        licenseCategory: {
          id: 'lc-1',
          requirements: [],
        },
      },
    ])

    const result = await getDeduplicatedModulesForStudent('sp-1')

    expect(result.modules).toHaveLength(0)
    expect(result.totalPrice).toBe(0)
  })

  it('deduplicates modules by course ID only', async () => {
    prismaMock.studentLicenseTarget.findMany.mockResolvedValue([
      {
        studentProfileId: 'sp-1',
        licenseCategory: {
          id: 'lc-1',
          requirements: [
            { course: { id: 'c1', name: 'Module A', price: 1000, currency: 'EUR' } },
          ],
        },
      },
      {
        studentProfileId: 'sp-1',
        licenseCategory: {
          id: 'lc-2',
          requirements: [
            { course: { id: 'c1', name: 'Module A (same)', price: 1000, currency: 'EUR' } },
          ],
        },
      },
    ])

    const result = await getDeduplicatedModulesForStudent('sp-1')

    expect(result.modules).toHaveLength(1)
    expect(result.modules[0].id).toBe('c1')
    expect(result.totalPrice).toBe(1000)
  })
})

describe('getRequiredModulesForLicenses', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns unique modules for given license categories', async () => {
    prismaMock.licenseModuleRequirement.findMany.mockResolvedValue([
      { course: { id: 'c1', name: 'Module A', price: 1000, currency: 'EUR' } },
      { course: { id: 'c2', name: 'Module B', price: 2000, currency: 'EUR' } },
      { course: { id: 'c1', name: 'Module A', price: 1000, currency: 'EUR' } },
    ])

    const result = await getRequiredModulesForLicenses(['lc-1', 'lc-2'])

    expect(result.modules).toHaveLength(2)
    expect(result.totalPrice).toBe(3000)
    expect(result.currency).toBe('EUR')
  })

  it('returns empty set for empty license category array', async () => {
    prismaMock.licenseModuleRequirement.findMany.mockResolvedValue([])

    const result = await getRequiredModulesForLicenses([])

    expect(result.modules).toHaveLength(0)
    expect(result.totalPrice).toBe(0)
  })

  it('defaults currency to EUR when no modules found', async () => {
    prismaMock.licenseModuleRequirement.findMany.mockResolvedValue([])

    const result = await getRequiredModulesForLicenses(['lc-1'])

    expect(result.currency).toBe('EUR')
  })
})
