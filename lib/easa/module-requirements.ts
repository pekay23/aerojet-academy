/**
 * EASA Part-66 examination requirements per module and license category.
 *
 * Sources:
 * - https://www.part66online.com/examination/
 * - https://www.easa.europa.eu/en/document-library/easa-articles/regulation-eu-20181142
 * - https://amroba.org.au/wp-content/uploads/2015/08/ModulesLevels.pdf
 */

export interface ModuleExamRequirement {
  moduleCode: string
  categoryQuestions: Record<string, number> // category -> MCQ count
  categoryEssay: Record<string, number> // category -> essay count
  timePerQuestionSecs: number // ~75 seconds per MCQ
  essayTimeMins: number // 20 mins per essay
  passMarkPct: number
}

/**
 * EASA Part-66 Module examination requirements.
 * Numbers are official EASA minimum MCQ counts per module per category.
 */
export const EASA_MODULE_REQUIREMENTS: Record<string, ModuleExamRequirement> = {
  // Module 1 - Mathematics
  M1: {
    moduleCode: 'M1',
    categoryQuestions: { A: 16, B1: 32, B2: 32, B3: 32 },
    categoryEssay: { A: 0, B1: 0, B2: 0, B3: 0 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 2 - Physics
  M2: {
    moduleCode: 'M2',
    categoryQuestions: { A: 32, B1: 52, B2: 52, B3: 32 },
    categoryEssay: { A: 0, B1: 0, B2: 0, B3: 0 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 3 - Electrical Fundamentals
  M3: {
    moduleCode: 'M3',
    categoryQuestions: { A: 20, B1: 52, B2: 52, B3: 24 },
    categoryEssay: { A: 0, B1: 0, B2: 0, B3: 0 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 4 - Electronics Fundamentals
  M4: {
    moduleCode: 'M4',
    categoryQuestions: { A: 0, B1: 20, B2: 40, B3: 8 },
    categoryEssay: { A: 0, B1: 0, B2: 0, B3: 0 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 5 - Digital Techniques / Electronic Instrument Systems
  M5: {
    moduleCode: 'M5',
    categoryQuestions: { A: 16, B1: 40, B2: 72, B3: 16 },
    categoryEssay: { A: 0, B1: 0, B2: 0, B3: 0 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 6 - Materials and Hardware
  M6: {
    moduleCode: 'M6',
    categoryQuestions: { A: 52, B1: 72, B2: 60, B3: 60 },
    categoryEssay: { A: 0, B1: 0, B2: 0, B3: 0 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 7 - Maintenance Practices
  M7: {
    moduleCode: 'M7',
    categoryQuestions: { A: 72, B1: 80, B2: 60, B3: 60 },
    categoryEssay: { A: 2, B1: 2, B2: 2, B3: 2 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 8 - Basic Aerodynamics
  M8: {
    moduleCode: 'M8',
    categoryQuestions: { A: 24, B1: 24, B2: 24, B3: 24 },
    categoryEssay: { A: 0, B1: 0, B2: 0, B3: 0 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 9 - Human Factors
  M9: {
    moduleCode: 'M9',
    categoryQuestions: { A: 20, B1: 20, B2: 20, B3: 20 },
    categoryEssay: { A: 1, B1: 1, B2: 1, B3: 1 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 10 - Aviation Legislation
  M10: {
    moduleCode: 'M10',
    categoryQuestions: { A: 32, B1: 40, B2: 40, B3: 32 },
    categoryEssay: { A: 1, B1: 1, B2: 1, B3: 1 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 11A - Turbine Aeroplane Aerodynamics, Structures and Systems
  M11A: {
    moduleCode: 'M11A',
    categoryQuestions: { A: 108, B1: 140, B2: 0, B3: 60 },
    categoryEssay: { A: 0, B1: 0, B2: 0, B3: 0 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 12 - Helicopter Aerodynamics, Structures and Systems
  M12: {
    moduleCode: 'M12',
    categoryQuestions: { A: 100, B1: 128, B2: 0, B3: 0 },
    categoryEssay: { A: 0, B1: 0, B2: 0, B3: 0 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 13 - Aircraft Aerodynamics, Structures and Systems (B2)
  M13: {
    moduleCode: 'M13',
    categoryQuestions: { A: 0, B1: 0, B2: 188, B3: 0 },
    categoryEssay: { A: 0, B1: 0, B2: 0, B3: 0 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 14 - Propulsion (B2)
  M14: {
    moduleCode: 'M14',
    categoryQuestions: { A: 0, B1: 0, B2: 24, B3: 0 },
    categoryEssay: { A: 0, B1: 0, B2: 0, B3: 0 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 15 - Gas Turbine Engine
  M15: {
    moduleCode: 'M15',
    categoryQuestions: { A: 60, B1: 92, B2: 0, B3: 0 },
    categoryEssay: { A: 0, B1: 0, B2: 0, B3: 0 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 16 - Piston Engine
  M16: {
    moduleCode: 'M16',
    categoryQuestions: { A: 52, B1: 72, B2: 0, B3: 68 },
    categoryEssay: { A: 0, B1: 0, B2: 0, B3: 0 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
  // Module 17 - Propeller
  M17: {
    moduleCode: 'M17',
    categoryQuestions: { A: 20, B1: 32, B2: 0, B3: 32 },
    categoryEssay: { A: 0, B1: 0, B2: 0, B3: 0 },
    timePerQuestionSecs: 75,
    essayTimeMins: 20,
    passMarkPct: 75,
  },
}

/**
 * Get the maximum MCQ count required for any category for a given module.
 * This is used to calculate the minimum pool size.
 */
export function getMaxCategoryQuestionCount(moduleCode: string): number {
  const req = EASA_MODULE_REQUIREMENTS[moduleCode]
  if (!req) return 40 // default fallback
  return Math.max(...Object.values(req.categoryQuestions), 0)
}

/**
 * Get the MCQ count required for a specific module and license category.
 */
export function getCategoryQuestionCount(moduleCode: string, categoryCode: string): number {
  const req = EASA_MODULE_REQUIREMENTS[moduleCode]
  if (!req) return 40 // default fallback
  return req.categoryQuestions[categoryCode] ?? getMaxCategoryQuestionCount(moduleCode)
}

/**
 * Get the maximum essay count required for any category for a given module.
 */
export function getMaxCategoryEssayCount(moduleCode: string): number {
  const req = EASA_MODULE_REQUIREMENTS[moduleCode]
  if (!req) return 0
  return Math.max(...Object.values(req.categoryEssay), 0)
}

/**
 * Get the essay count required for a specific module and license category.
 */
export function getCategoryEssayCount(moduleCode: string, categoryCode: string): number {
  const req = EASA_MODULE_REQUIREMENTS[moduleCode]
  if (!req) return 0
  return req.categoryEssay[categoryCode] ?? getMaxCategoryEssayCount(moduleCode)
}

/**
 * Calculate the recommended minimum pool size for a module.
 * Formula: category_questions * 3 (for question variation) when category is known,
 * otherwise max_category_questions * 3.
 */
export function calculateMinimumPoolSize(moduleCode: string, categoryCode?: string | null): number {
  const maxMcq = categoryCode ? getCategoryQuestionCount(moduleCode, categoryCode) : getMaxCategoryQuestionCount(moduleCode)
  const maxEssay = categoryCode ? getCategoryEssayCount(moduleCode, categoryCode) : getMaxCategoryEssayCount(moduleCode)
  // MCQ pool: 3x the category requirement for variation
  // Essay pool: 5x the category requirement
  const mcqPool = maxMcq * 3
  const essayPool = maxEssay * 5
  return Math.max(mcqPool, essayPool, 60) // minimum 60
}

/**
 * Get recommended mcqCount for a bank based on EASA requirements.
 */
export function getRecommendedMcqCount(moduleCode: string): number {
  return getMaxCategoryQuestionCount(moduleCode)
}
