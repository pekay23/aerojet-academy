export interface ApprovalResult<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

export interface ApprovalOptions {
  approvedBy: string
  notes?: string
}

// Re-export shared staff types
export type {
  SerializedPaymentCard,
  SerializedPracticalRecord,
  SerializedCourse,
  SerializedInstructor,
  SerializedAtaChapter,
  SerializedStudent,
  SerializedExamComponent,
  SerializedExamBundle,
  SerializedFullTimeEnrollmentForOjt,
} from '@/lib/types/staff'
