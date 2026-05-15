import { NextRequest, NextResponse } from 'next/server'
import { prismaUnfiltered as prisma } from '@/lib/prisma/client'
import { getAuthSession } from '@/lib/auth/helpers'
import { z } from 'zod'

const SETTING_PREFIX = 'class_seating_'

const assignmentSchema = z.object({
  assignments: z.record(z.string(), z.string()), // { seatId: userId }
})

/**
 * GET: Retrieve class seating assignments
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const setting = await prisma.systemSetting.findUnique({
    where: { key: `${SETTING_PREFIX}${id}` },
  })

  const assignments: Record<string, string> = setting
    ? JSON.parse(setting.value)
    : {}

  return NextResponse.json({ assignments })
}

/**
 * PUT: Save class seating assignments
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'SUPER_ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  // Verify class exists
  const cls = await prisma.class.findUnique({ where: { id } })
  if (!cls) {
    return NextResponse.json({ error: 'Class not found' }, { status: 404 })
  }

  const json = await req.json()
  const result = assignmentSchema.safeParse(json)
  if (!result.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }

  const key = `${SETTING_PREFIX}${id}`
  await prisma.systemSetting.upsert({
    where: { key },
    create: {
      key,
      value: JSON.stringify(result.data.assignments),
      type: 'JSON',
      description: `Seating assignments for class ${id}`,
    },
    update: {
      value: JSON.stringify(result.data.assignments),
    },
  })

  return NextResponse.json({ success: true, assignments: result.data.assignments })
}
