import type { Prisma, PrismaClient } from '@prisma/client'

type Tx = PrismaClient | Prisma.TransactionClient

const CATEGORY_EQUIVALENTS: Record<string, string[]> = {
  A: ['A', 'A1', 'A2', 'A3', 'A4'],
  A1: ['A1', 'A'],
  A2: ['A2', 'A'],
  A3: ['A3', 'A'],
  A4: ['A4', 'A'],
  B1: ['B1', 'B1.1', 'B1.2', 'B1.3', 'B1.4'],
  'B1.1': ['B1.1', 'B1'],
  'B1.2': ['B1.2', 'B1'],
  'B1.3': ['B1.3', 'B1'],
  'B1.4': ['B1.4', 'B1'],
  B2: ['B2'],
  B2L: ['B2L'],
  B3: ['B3'],
}

export function normalizeCategoryCode(code: string | null | undefined) {
  return code?.trim().toUpperCase() || null
}

export function categoryMatchesTarget(componentCategory: string | null | undefined, targetCategories: string[]) {
  const component = normalizeCategoryCode(componentCategory)
  if (!component) return true

  return targetCategories.some((target) => {
    const normalizedTarget = normalizeCategoryCode(target)
    if (!normalizedTarget) return false
    return (CATEGORY_EQUIVALENTS[normalizedTarget] ?? [normalizedTarget]).includes(component)
  })
}

export async function getStudentTargetCategoryCodes(tx: Tx, userId: string): Promise<string[]> {
  const user = await tx.user.findUnique({
    where: { id: userId },
    select: {
      selectedLicenseCategories: true,
      studentProfile: {
        select: {
          licenseTargets: {
            select: { licenseCategory: { select: { code: true } } },
          },
        },
      },
    },
  })

  const codes = new Set<string>()
  for (const code of user?.selectedLicenseCategories ?? []) {
    const normalized = normalizeCategoryCode(code)
    if (normalized) codes.add(normalized)
  }
  for (const target of user?.studentProfile?.licenseTargets ?? []) {
    const normalized = normalizeCategoryCode(target.licenseCategory.code)
    if (normalized) codes.add(normalized)
  }

  return [...codes]
}

export function filterForStudentTargets<T extends { categoryCode?: string | null }>(
  rows: T[],
  targetCategories: string[]
) {
  if (targetCategories.length === 0) return rows
  return rows.filter((row) => categoryMatchesTarget(row.categoryCode, targetCategories))
}

export function getInternalBankCategoryCode(bank: { categoryCode?: string | null; categoryConfig?: Prisma.JsonValue | null }) {
  const direct = normalizeCategoryCode(bank.categoryCode)
  if (direct) return direct

  const config = bank.categoryConfig
  if (config && typeof config === 'object' && !Array.isArray(config)) {
    const maybeCode = (config as Record<string, unknown>).categoryCode
    return typeof maybeCode === 'string' ? normalizeCategoryCode(maybeCode) : null
  }

  return null
}

