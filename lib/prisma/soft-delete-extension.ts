import 'server-only'
import { Prisma } from '@prisma/client'

/**
 * Prisma Extension for automated soft-delete handling.
 * Only applies to models that have a `deletedAt` column.
 * Automatically filters out records where deletedAt is not null for read operations.
 */

const SOFT_DELETE_MODELS = new Set([
  'User',
  'AdminCalendarEvent',
  'AdminNote',
  'Enrollment',
  'Grade',
  'ExamEvent',
  'PoolMembership',
  'ExamBooking',
  'Payment',
])

export const softDeleteExtension = () =>
  Prisma.defineExtension({
    name: 'softDeleteExtension',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (
            model &&
            SOFT_DELETE_MODELS.has(model) &&
            (operation === 'findUnique' ||
              operation === 'findFirst' ||
              operation === 'findMany' ||
              operation === 'count')
          ) {
            args.where = { ...args.where, deletedAt: null }
          }
          return query(args)
        },
      },
    },
  })
