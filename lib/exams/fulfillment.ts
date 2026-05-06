type RawDemandStatus =
  | 'DEMAND_CAPTURED'
  | 'POOLED'
  | 'SCHEDULED'
  | 'EXECUTED'
  | 'ROLLED_FORWARD'
  | 'POSTPONED'
  | 'CANCELLED'
  | string
  | null
  | undefined

export type BookingFulfillmentState =
  | 'PENDING_POOL_CONFIRMATION'
  | 'PENDING_FULFILLMENT'
  | 'EXCUSED_PENDING_REBOOK'
  | 'SCHEDULED'
  | 'EXECUTED'
  | 'ROLLED_FORWARD'
  | 'POSTPONED'
  | 'CANCELLED'
  | null

/**
 * Fulfillment source of truth:
 * - `ExamBooking.demandStatus` and `executedAt` track per-module delivery state.
 * - `ExamBooking.result = 'EXCUSED'` means the candidate was excused — their paid
 *   guarantee is STILL OWED. This is distinct from EXECUTED (consumed) and ABSENT (no-show).
 * - `BookingEntitlement` remains the accounting/resit layer for grouped purchases.
 */
export function deriveBookingFulfillmentState(input: {
  demandStatus?: RawDemandStatus
  executedAt?: Date | string | null
  rolloverToEventId?: string | null
  result?: string | null
  status?: string | null
}): BookingFulfillmentState {
  const { demandStatus, executedAt, rolloverToEventId, result, status } = input

  if (executedAt || demandStatus === 'EXECUTED') return 'EXECUTED'

  // EXCUSED: seat still owed, candidate must rebook or be placed in next event
  if (result?.toUpperCase() === 'EXCUSED') return 'EXCUSED_PENDING_REBOOK'

  if (demandStatus === 'ROLLED_FORWARD') return 'ROLLED_FORWARD'
  if (demandStatus === 'SCHEDULED') return 'SCHEDULED'
  if (demandStatus === 'POSTPONED') {
    return rolloverToEventId ? 'POSTPONED' : 'PENDING_FULFILLMENT'
  }
  if (demandStatus === 'CANCELLED' || status === 'CANCELLED') return 'CANCELLED'
  if (demandStatus === 'POOLED' || demandStatus === 'DEMAND_CAPTURED') {
    return 'PENDING_POOL_CONFIRMATION'
  }

  return null
}

export function hasMixedBookingGroupFulfillment(input: Array<{
  demandStatus?: RawDemandStatus
  executedAt?: Date | string | null
  rolloverToEventId?: string | null
  result?: string | null
  status?: string | null
}>) {
  let hasExecuted = false
  let hasOutstanding = false

  for (const booking of input) {
    const state = deriveBookingFulfillmentState(booking)
    if (state === 'EXECUTED') {
      hasExecuted = true
      continue
    }
    // Excused, rolled, postponed, pending, and scheduled all count as outstanding
    if (
      state === 'ROLLED_FORWARD' ||
      state === 'POSTPONED' ||
      state === 'PENDING_POOL_CONFIRMATION' ||
      state === 'PENDING_FULFILLMENT' ||
      state === 'EXCUSED_PENDING_REBOOK' ||
      state === 'SCHEDULED'
    ) {
      hasOutstanding = true
    }
  }

  return hasExecuted && hasOutstanding
}

/** Non-outcome values stored in `result` that should NOT override fulfillment state */
const NON_OUTCOME_RESULTS = new Set(['MIGRATED'])

export function deriveBookingDisplayResult(input: {
  result?: string | null
  demandStatus?: RawDemandStatus
  executedAt?: Date | string | null
  rolloverToEventId?: string | null
  status?: string | null
}) {
  const rawResult = input.result?.trim()
  // Surface real exam outcome strings (PASS, FAIL, ABSENT, EXCUSED…)
  // but skip metadata-only values like MIGRATED so the fulfillment state shows instead
  if (rawResult && !NON_OUTCOME_RESULTS.has(rawResult.toUpperCase())) return rawResult

  const fulfillment = deriveBookingFulfillmentState(input)
  if (!fulfillment) return rawResult || null
  return fulfillment
}

/** Human-readable label for display in UI tables */
export function fulfillmentStateLabel(state: BookingFulfillmentState): string {
  switch (state) {
    case 'PENDING_POOL_CONFIRMATION': return 'Pending Pool Confirmation'
    case 'EXECUTED': return 'Executed'
    case 'EXCUSED_PENDING_REBOOK': return 'Excused – Pending Rebook'
    case 'SCHEDULED': return 'Scheduled'
    case 'ROLLED_FORWARD': return 'Rolled Forward'
    case 'POSTPONED': return 'Postponed'
    case 'PENDING_FULFILLMENT': return 'Pending Fulfillment'
    case 'CANCELLED': return 'Cancelled'
    default: return '—'
  }
}
