import { PoolStatus, MembershipStatus } from './enums'

export interface ExamPool {
  id: string
  eventId: string
  name: string
  examDate: string
  status: PoolStatus
  minCandidates: number
  maxCandidates: number
  currentMemberCount: number
  moduleDiversityCap: number
  createdAt: string
}

export interface PoolMembership {
  id: string
  poolId: string
  userId: string
  selectedModule: string
  status: MembershipStatus
  amountReserved: number
  amountPaid: number
  createdAt: string
}

export type { PoolStatus, MembershipStatus }
