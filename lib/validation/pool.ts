import { z } from 'zod'
import { MODULE_LIST } from '@/types/enums'

export const joinPoolSchema = z.object({
  poolId: z.string().min(1, 'Pool ID is required'),
  selectedModule: z.string().refine(
    (val) => MODULE_LIST.includes(val as any),
    'Invalid module selection'
  ),
})

export const createPoolSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(3),
  examDate: z.string().min(1),
  minCandidates: z.number().min(1).default(25),
  maxCandidates: z.number().min(1).default(28),
  moduleDiversityCap: z.number().min(1).default(4),
  venue: z.string().optional(),
})

export type JoinPoolInput = z.infer<typeof joinPoolSchema>
export type CreatePoolInput = z.infer<typeof createPoolSchema>
