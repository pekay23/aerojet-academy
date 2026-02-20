import { describe, it, expect } from 'vitest'
import { POOL_EXAM_FEE, POOL_MIN_CANDIDATES, POOL_MAX_CANDIDATES, MODULE_DIVERSITY_CAP } from '@/lib/pools/types'

describe('Pool Constants', () => {
  it('has correct exam fee', () => { expect(POOL_EXAM_FEE).toBe(300) })
  it('has correct min candidates', () => { expect(POOL_MIN_CANDIDATES).toBe(25) })
  it('has correct max candidates', () => { expect(POOL_MAX_CANDIDATES).toBe(28) })
  it('has correct diversity cap', () => { expect(MODULE_DIVERSITY_CAP).toBe(4) })
  it('min is less than max', () => { expect(POOL_MIN_CANDIDATES).toBeLessThan(POOL_MAX_CANDIDATES) })
})
