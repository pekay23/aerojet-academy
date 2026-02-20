import { NextRequest, NextResponse } from 'next/server'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

export async function POST(req: NextRequest) {
  const session = await getAuthSession()
  if (!session || !['ADMIN', 'STAFF'].includes((session.user as any).role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const messages: string[] = body.messages

  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  // Sanitise: strip blanks, trim, deduplicate
  const clean = [...new Set(messages.map((m) => m.trim()).filter(Boolean))]

  await prisma.systemSetting.upsert({
    where: { key: 'welcome_messages' },
    update: { value: JSON.stringify(clean), updatedBy: (session.user as any).id },
    create: {
      key: 'welcome_messages',
      value: JSON.stringify(clean),
      type: 'JSON',
      description: 'Rotating welcome messages shown on all portal dashboards',
      updatedBy: (session.user as any).id,
    },
  })

  return NextResponse.json({ success: true, count: clean.length })
}
