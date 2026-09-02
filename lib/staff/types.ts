export interface ApprovalResult<T = unknown> {
  success: boolean
  error?: string
  data?: T
}

export interface ApprovalOptions {
  approvedBy: string
  notes?: string
}