/**
 * Simplified canonical exam attempt-type vocabulary.
 *
 * - FIRST: First attempt at a module
 * - RESIT_1, RESIT_2: Immediate re-attempts (same session/period)
 * - RETAKE_1, RETAKE_2, RETAKE_3...: Later re-attempts (new session/period, unlimited)
 *
 * All inputs normalise to these canonical values.
 */

export const ATTEMPT_FIRST = 'FIRST'
export const ATTEMPT_RESIT_1 = 'RESIT_1'
export const ATTEMPT_RESIT_2 = 'RESIT_2'
export const RETAKE_PREFIX = 'RETAKE_'

export type AttemptType =
  typeof ATTEMPT_FIRST | typeof ATTEMPT_RESIT_1 | typeof ATTEMPT_RESIT_2 | `RETAKE_${number}`

export const ATTEMPT_VALUES: readonly (
  typeof ATTEMPT_FIRST | typeof ATTEMPT_RESIT_1 | typeof ATTEMPT_RESIT_2
)[] = [ATTEMPT_FIRST, ATTEMPT_RESIT_1, ATTEMPT_RESIT_2]

export const ATTEMPT_LABELS: Record<
  typeof ATTEMPT_FIRST | typeof ATTEMPT_RESIT_1 | typeof ATTEMPT_RESIT_2,
  string
> = {
  [ATTEMPT_FIRST]: 'First Attempt',
  [ATTEMPT_RESIT_1]: 'Resit 1',
  [ATTEMPT_RESIT_2]: 'Resit 2',
}

function retakeLabel(n: number): string {
  return `Retake ${n}`
}

/** Canonical alias map: normalized keys (spaces/hyphens → underscores, uppercase). */
const ATTEMPT_ALIASES: Record<string, AttemptType> = {
  FIRST: ATTEMPT_FIRST,
  FIRST_ATTEMPT: ATTEMPT_FIRST,
  INITIAL: ATTEMPT_FIRST,
  INITIAL_ATTEMPT: ATTEMPT_FIRST,
  '1ST': ATTEMPT_FIRST,

  RESIT: ATTEMPT_RESIT_1,
  RESIT_1: ATTEMPT_RESIT_1,
  FIRST_RESIT: ATTEMPT_RESIT_1,
  RESIT_2: ATTEMPT_RESIT_2,
  SECOND_RESIT: ATTEMPT_RESIT_2,
}

/**
 * Normalise any incoming attempt-type string to the canonical vocabulary.
 *
 * - null / undefined / empty → null (caller decides default)
 * - unknown / unmapped values → null (caller decides; never silently coerce to FIRST)
 * - spaces and hyphens are treated as underscores before matching
 */
export function normalizeAttemptType(raw: string | null | undefined): AttemptType | null {
  if (raw == null) return null
  const normalized = String(raw).trim().toUpperCase()
  if (!normalized) return null

  // Convert spaces and hyphens to underscores for canonical lookup
  const key = normalized.replace(/[\s-]+/g, '_')

  // Direct alias lookup
  const alias = ATTEMPT_ALIASES[key]
  if (alias) return alias

  // RETAKE_N (unlimited)
  const retakeMatch = key.match(/^RETAKE_(\d+)$/)
  if (retakeMatch) {
    const n = Number.parseInt(retakeMatch[1], 10)
    if (n >= 1) return `RETAKE_${n}` as AttemptType
  }

  // Legacy RESIT_N numeric suffixes (RESIT_3 → RETAKE_1, RESIT_4 → RETAKE_2, etc.)
  const numericResit = key.match(/^RESIT_(\d+)$/)
  if (numericResit) {
    const n = Number.parseInt(numericResit[1], 10)
    if (n <= 1) return ATTEMPT_RESIT_1
    if (n === 2) return ATTEMPT_RESIT_2
    // RESIT_3+ maps to RETAKE_(n-2)
    return `RETAKE_${n - 2}` as AttemptType
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
  if (normalized) {
    if (normalized === ATTEMPT_FIRST) return ATTEMPT_LABELS[ATTEMPT_FIRST]
    if (normalized === ATTEMPT_RESIT_1) return ATTEMPT_LABELS[ATTEMPT_RESIT_1]
    if (normalized === ATTEMPT_RESIT_2) return ATTEMPT_LABELS[ATTEMPT_RESIT_2]
    // RETAKE_N
    const retakeMatch = normalized.match(/^RETAKE_(\d+)$/)
    if (retakeMatch) return retakeLabel(Number.parseInt(retakeMatch[1], 10))
    return normalized // fallback
  }
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
