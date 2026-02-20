import { z } from 'zod'

export const updateProfileSchema = z.object({
  firstName: z.string().min(2).optional(),
  lastName: z.string().min(2).optional(),
  phone: z.string().min(10).optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
})

export const walletTopUpSchema = z.object({
  amount: z.number().min(50, 'Minimum top-up is €50').max(10000, 'Maximum top-up is €10,000'),
  method: z.enum(['BANK_TRANSFER', 'CARD']).default('BANK_TRANSFER'),
})

export const enrollCourseSchema = z.object({
  courseId: z.string().min(1, 'Course is required'),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type WalletTopUpInput = z.infer<typeof walletTopUpSchema>
