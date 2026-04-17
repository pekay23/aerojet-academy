import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'STAFF'].includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const messages = body.messages // This can be an object: { STUDENT: [], STAFF: [] ... }

  if (!messages || typeof messages !== 'object') {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Sanitise each role's messages
  const cleanMessages: Record<string, string[]> = {}

  for (const [role, roleMsgs] of Object.entries(messages)) {
    if (Array.isArray(roleMsgs)) {
      cleanMessages[role] = [...new Set(roleMsgs.map((m: any) => String(m).trim()).filter(Boolean))]
    }
  }

  if (Object.keys(cleanMessages).length === 0) {
    return NextResponse.json({ error: 'At least one message is required' }, { status: 400 })
  }

  await prisma.systemSetting.upsert({
    where: { key: 'welcome_messages' },
    update: { value: JSON.stringify(cleanMessages), updatedBy: session.user.id },
    create: {
      key: 'welcome_messages',
      value: JSON.stringify(cleanMessages),
      type: 'JSON',
      description: 'Rotating welcome messages shown on portal dashboards (categorised by role)',
      updatedBy: session.user.id,
    },
  })

  return NextResponse.json({ success: true, count: Object.values(cleanMessages).flat().length })
}
