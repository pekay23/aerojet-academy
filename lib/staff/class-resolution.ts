import 'server-only'

import { prismaUnfiltered } from '@/lib/prisma/client'

const CLASS_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const CUID_PATTERN = /^c[a-z0-9]{24,}$/i

export async function resolveClassTargetId(id: string): Promise<string | null> {
  if (CLASS_ID_PATTERN.test(id) || CUID_PATTERN.test(id)) return id

  const matches = await prismaUnfiltered.$queryRaw<{ id: string }[]>`
    SELECT id
    FROM "classes"
    WHERE trim(both '-' from lower(
      regexp_replace(
        regexp_replace(trim("name"), '[^a-zA-Z0-9]+', '-', 'g'),
        '-+', '-', 'g'
      )
    )) = ${id}
    LIMIT 1
  `

  return matches[0]?.id ?? null
}
