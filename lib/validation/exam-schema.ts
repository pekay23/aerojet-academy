import { z } from 'zod'

export const ExamConfigSchema = z.object({
  fullscreen: z.boolean().default(true),
  sebRequired: z.boolean().default(false),
  violationThreshold: z.number().min(0).default(3),
  strictMode: z.boolean().default(false),
  autoSubmitOnViolation: z.boolean().default(false),
  allowReviewLater: z.boolean().default(true),
  randomizeQuestions: z.boolean().default(true),
  randomizeOptions: z.boolean().default(true),
})

export type ExamConfig = z.infer<typeof ExamConfigSchema>
