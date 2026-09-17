/**
 * Server-side helper: parse `searchParams.sort` and `searchParams.order`
 * into a Prisma `orderBy` value. Pass a map of allowed keys → Prisma field
 * paths to prevent arbitrary sort injection.
 *
 * Returns the `defaultOrderBy` when no/invalid sort params are present.
 *
 * @example
 *   const orderBy = buildOrderBy(searchParams, {
 *     enrolledAt: 'enrolledAt',
 *     student:    'user.profile.lastName',
 *     course:     'course.name',
 *     status:     'status',
 *     amount:     'amountPaid',
 *   })
 */
export function buildOrderBy<TKeys extends string>(
  params: { sort?: string | null; order?: string | null },
  allowed: Record<TKeys, string>,
  defaultOrderBy: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' }
): Record<string, 'asc' | 'desc'> {
  const sort = params.sort
  const orderRaw = params.order
  if (!sort || !(sort in allowed)) return defaultOrderBy
  const fieldPath = allowed[sort as TKeys]
  const order: 'asc' | 'desc' = orderRaw === 'desc' ? 'desc' : 'asc'

  // For nested paths, Prisma needs an object: { user: { profile: { lastName: 'asc' } } }
  const parts = fieldPath.split('.')
  let acc: Record<string, unknown> = { [parts[parts.length - 1]]: order }
  for (let i = parts.length - 2; i >= 0; i--) {
    acc = { [parts[i]]: acc }
  }
  return acc as Record<string, 'asc' | 'desc'>
}
