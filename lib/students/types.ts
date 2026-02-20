export interface PromotionResult {
  success: boolean
  studentId?: string
  error?: string
}

export interface StudentIdGenResult {
  studentId: string
  sequence: number
}
