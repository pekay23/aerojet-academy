export interface PoolJoinInput {
  poolId: string
  userId: string
  examComponentId: string
}

export interface PoolJoinResult {
  success: boolean
  membership?: any
  error?: string
  autoConfirmed?: boolean
  triggeredNearFull?: boolean
}

export interface PoolValidationResult {
  valid: boolean
  error?: string
}

export const POOL_EXAM_FEE = 300 // EUR
export const POOL_MIN_CANDIDATES = 25
export const POOL_MAX_CANDIDATES = 28
export const POOL_NEAR_FULL_THRESHOLD = 23
export const MODULE_DIVERSITY_CAP = 4
export const POOL_DEADLINE_DAYS = 21 // Days before exam to check
