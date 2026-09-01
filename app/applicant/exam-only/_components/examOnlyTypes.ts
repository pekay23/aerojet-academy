export interface ExamComponent {
  id: string
  code: string
  name: string
  type: string
  duration: number
  individualPrice: number
  poolPrice: number
  course: {
    code: string
    name: string
  }
}

export interface ExamPool {
  id: string
  name: string
  examDate: string
  examStartTime: string
  examEndTime: string
  status: string
  currentMemberCount: number
  maxCandidates: number
  seatPrice: number
  allowedModules: string[]
  event: {
    name: string
  }
  modules: string[]
}

export interface WalletInfo {
  balance: number
  reservedBalance: number
  availableBalance: number
}

export interface PoolMembership {
  id: string
  status: string
  amountReserved: number
  pool: {
    name: string
    examDate: string
  }
  examComponent?: {
    course: {
      code: string
    }
  }
}

export interface ExamBooking {
  id: string
  status: string
  amountPaid: number
  examDate: string
  examComponent?: {
    course: {
      code: string
      name: string
    }
  }
}

export interface WalletTransaction {
  id: string
  amount: number
  type: string
  status: string
  createdAt: string
  referenceType?: string
  referenceId?: string
  description?: string
}

export interface WalletPayment {
  id: string
  amount: number
  status: string
  paymentMethod?: string
  createdAt: string
  rejectionReason?: string
}

export interface ExamBundle {
  id: string
  bundleType: string
  totalSeats: number
  usedSeats: number
  amountPaid: number
  validUntil: string
  status: string
}

export type TabType = 'packages' | 'pools'

export interface ExamOnlyPrices {
  pool: number
  individual: number
  twoSeat: number
  fourSeat: number
}

export const poolStatusLabel: Record<string, string> = {
  DRAFT: 'Upcoming',
  OPEN: 'Open',
  NEAR_FULL: 'Nearly Full',
  CONFIRMED: 'Confirmed',
  LOCKED: 'In Progress',
  FAILED: 'Cancelled',
  MERGED: 'Merged',
  COMPLETED: 'Completed',
}

export const poolStatusColor: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  OPEN: 'bg-green-100 text-green-700',
  NEAR_FULL: 'bg-orange-100 text-orange-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  LOCKED: 'bg-purple-100 text-purple-700',
  FAILED: 'bg-red-100 text-red-700',
  MERGED: 'bg-slate-100 text-slate-500',
  COMPLETED: 'bg-slate-100 text-slate-500',
}

export interface GroupedCourse {
  code: string
  name: string
  components: ExamComponent[]
}
