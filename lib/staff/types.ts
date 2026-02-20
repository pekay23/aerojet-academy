export interface ApprovalResult {
  success: boolean
  error?: string
  data?: any
}

export interface ApprovalOptions {
  approvedBy: string
  notes?: string
}
