export interface ExamPool {
  id: string
  eventId: string
  name: string
  examDate: Date | string
  status: 'DRAFT' | 'OPEN' | 'NEAR_FULL' | 'CONFIRMED' | 'LOCKED' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  minCandidates: number
  maxCandidates: number
  currentMemberCount: number
  moduleDiversityCap: number
  createdAt: Date | string
}

export interface PoolMembership {
  id: string
  poolId: string
  userId: string
  selectedModule: string
  status: 'RESERVED' | 'CONFIRMED' | 'CANCELLED' | 'REFUNDED'
  amountReserved: number
  amountPaid: number
  createdAt: Date | string
}

export type PoolStatus = ExamPool['status']
export type MembershipStatus = PoolMembership['status']
