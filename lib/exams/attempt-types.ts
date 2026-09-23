/**
 * Canonical exam attempt-type vocabulary and normalisation.
 *
 * All exam booking/result writes and merges route through this module so that
 * legacy labels such as `first_attempt`, `FIRST_ATTEMPT`, `INITIAL`, `resit`,
 * `FIRST_RESIT`, `SECOND_RESIT`, `THIRD_RESIT` collapse to the same canonical
 * value as the modern `FIRST` / `RESIT_1` / `RESIT_2` / `RESIT_3` labels.
 */

export const ATTEMPT_FIRST = 'FIRST'
export const ATTEMPT_RESIT_1 = 'RESIT_1'
export const ATTEMPT_RESIT_2 = 'RESIT_2'
export const ATTEMPT_RESIT_3 = 'RESIT_3'

export type AttemptType =
  typeof ATTEMPT_FIRST | typeof ATTEMPT_RESIT_1 | typeof ATTEMPT_RESIT_2 | typeof ATTEMPT_RESIT_3

export const ATTEMPT_VALUES: readonly AttemptType[] = [
  ATTEMPT_FIRST,
  ATTEMPT_RESIT_1,
  ATTEMPT_RESIT_2,
  ATTEMPT_RESIT_3,
]

export const ATTEMPT_LABELS: Record<AttemptType, string> = {
  [ATTEMPT_FIRST]: '1st Attempt',
  [ATTEMPT_RESIT_1]: 'Resit (2nd)',
  [ATTEMPT_RESIT_2]: 'Resit (3rd)',
  [ATTEMPT_RESIT_3]: 'Resit (4th+)',
}

/** Labels that map to the FIRST attempt. */
const FIRST_SYNONYMS = new Set<string>([
  'FIRST',
  'FIRST_ATTEMPT',
  'INITIAL',
  'INITIAL_ATTEMPT',
  'FIRST_ATTEMPT_INITIAL',
])

/** Labels that map to RESIT_1. */
const RESIT_1_SYNONYMS = new Set<string>(['RESIT_1', 'FIRST_RESIT', 'RESIT', 'RESIT1'])

/** Labels that map to RESIT_2. */
const RESIT_2_SYNONYMS = new Set<string>(['RESIT_2', 'SECOND_RESIT', 'RESIT2'])

/** Labels that map to RESIT_3. */
const RESIT_3_SYNONYMS = new Set<string>(['RESIT_3', 'THIRD_RESIT', 'RESIT3'])

/**
 * Normalise any incoming attempt-type string to the canonical vocabulary.
 *
 * - null / undefined / empty → FIRST (safe default for display + merge keys)
 * - unknown / unmapped values → null (caller decides; never silently coerce to FIRST)
 */
export function normalizeAttemptType(raw: string | null | undefined): AttemptType | null {
  if (raw == null) return null
  const normalized = String(raw).trim().toUpperCase()
  if (!normalized) return null

  if (FIRST_SYNONYMS.has(normalized)) return ATTEMPT_FIRST
  if (RESIT_1_SYNONYMS.has(normalized)) return ATTEMPT_RESIT_1
  if (RESIT_2_SYNONYMS.has(normalized)) return ATTEMPT_RESIT_2
  if (RESIT_3_SYNONYMS.has(normalized)) return ATTEMPT_RESIT_3

  // Allow RESIT_N numeric suffixes as a final fallback (RESIT_4 → RESIT_3).
  const numericResit = normalized.match(/^RESIT[_-]?(\d+)$/)
  if (numericResit) {
    const n = Number.parseInt(numericResit[1], 10)
    if (n <= 1) return ATTEMPT_RESIT_1
    if (n === 2) return ATTEMPT_RESIT_2
    return ATTEMPT_RESIT_3
  }

  return null
}

/**
 * Resolve an attempt type for writes: normalise, fall back to FIRST only when
 * the input is missing/blank, and throw on genuinely unknown strings so that
 * data-path mismatches surface at the boundary instead of silently persisting.
 */
export function resolveAttemptType(raw: string | null | undefined): AttemptType {
  const normalized = normalizeAttemptType(raw)
  if (normalized) return normalized
  if (raw == null || String(raw).trim() === '') return ATTEMPT_FIRST
  throw new Error(`Unknown attempt type: '${raw}'`)
}

/**
 * Merge-friendly resolution: like resolveAttemptType but never throws.
 * Returns a stable uppercase string for unknown non-blank values (so they
 * don't collide with canonical values). This is the function callers should
 * use when they need a deterministic merge key and can't fail on unknown input.
 */
export function mergeAttemptType(raw: string | null | undefined): AttemptType | string {
  const normalized = normalizeAttemptType(raw)
  if (normalized) return normalized
  if (raw == null || String(raw).trim() === '') return ATTEMPT_FIRST
  return String(raw).trim().toUpperCase()
}

/**
 * Format an attempt type for display: normalise and return the human-readable
 * label, or em-dash for unknown/unmappable values.
 */
export function formatAttemptType(raw: string | null | undefined): string {
  const normalized = normalizeAttemptType(raw)
  if (normalized) return ATTEMPT_LABELS[normalized]
  if (raw == null || String(raw).trim() === '') return ATTEMPT_LABELS[ATTEMPT_FIRST]
  return '—'
}

/** Build a stable merge key from a module code + attempt type. */
export function attemptRecordKey(
  moduleCode: string | null | undefined,
  attemptType: AttemptType | string | null | undefined
): string {
  const normalizedModuleCode = (moduleCode || '').trim().toUpperCase()
  const normalizedAttemptType = resolveAttemptType(attemptType)
  return `${normalizedModuleCode}:${normalizedAttemptType}`
}
