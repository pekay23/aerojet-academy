/**
 * EASA Part-66 Category Exemption Rules
 *
 * In EASA Part-66 aviation maintenance licensing, passing an exam for a higher
 * license category can exempt a student from writing the same module for lower
 * categories.
 *
 * Hierarchy:
 * - B2 exempts B1 for shared theory modules (not mechanical-specific)
 * - B2 exempts A for same shared theory modules
 * - B1 exempts A for ALL A-level modules
 * - B1 does NOT exempt B2 (avionics-specific modules differ)
 * - B3 is standalone — not affected by B1/B2 exemptions
 */

export const CATEGORY_EXEMPTION_RULES: Record<
  string,
  Array<{ targetCategory: string; modules: string[] }>
> = {
  B2: [
    {
      targetCategory: 'B1',
      modules: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'M9A', 'M10'],
    },
    {
      targetCategory: 'A',
      modules: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'M9A', 'M10'],
    },
  ],
  B1: [
    {
      targetCategory: 'A',
      modules: [
        'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7A', 'M8', 'M9A', 'M10',
        'M11A', 'M11B', 'M15', 'M16', 'M17A',
      ],
    },
  ],
}

/**
 * Extract the base module code from an exam component code.
 * e.g. "M6_MCQ_B2" → "M6", "M9A_ESSAY_B1" → "M9A", "M11A" → "M11A"
 */
function extractBaseModuleCode(code: string): string {
  const match = code.match(/^(M\d+[A-Z]?)/)
  return match ? match[1] : code
}

/**
 * Given a passed category and module code (or full exam component code),
 * return the list of lower-category exemptions that should be granted.
 */
export function getExemptions(
  passedCategory: string,
  moduleCode: string
): Array<{ targetCategory: string; moduleCode: string }> {
  const baseModule = extractBaseModuleCode(moduleCode)
  const rules = CATEGORY_EXEMPTION_RULES[passedCategory]

  if (!rules) {
    return []
  }

  const exemptions: Array<{ targetCategory: string; moduleCode: string }> = []

  for (const rule of rules) {
    if (rule.modules.includes(baseModule)) {
      exemptions.push({
        targetCategory: rule.targetCategory,
        moduleCode: baseModule,
      })
    }
  }

  return exemptions
}
