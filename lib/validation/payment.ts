import { z } from 'zod'

export const createPaymentSchema = z.object({
  type: z.enum(['REGISTRATION_FEE', 'COURSE_FEE', 'EXAM_FEE', 'WALLET_TOP_UP']),
  amount: z.number().positive(),
  method: z.enum(['BANK_TRANSFER', 'CARD', 'MANUAL']).default('BANK_TRANSFER'),
  reference: z.string().optional(),
  description: z.string().optional(),
})

export const approvePaymentSchema = z.object({
  action: z.enum(['approve', 'reject']),
  notes: z.string().optional(),
})

export const uploadPaymentProofSchema = z.object({
  paymentId: z.string().optional(),
  fileUrl: z.string().url('Invalid file URL'),
})

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>
export type ApprovePaymentInput = z.infer<typeof approvePaymentSchema>
