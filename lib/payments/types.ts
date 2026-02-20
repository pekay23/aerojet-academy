export interface PaymentCreateInput {
  userId: string
  type: string
  amount: number
  currency?: string
  method?: string
  reference?: string
  description?: string
  enrollmentId?: string
}

export interface PaymentVerificationResult {
  verified: boolean
  error?: string
}
