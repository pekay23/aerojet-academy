import { NextResponse } from 'next/server'
import { requireExaminer } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'

export async function GET() {
  try {
    const session = await requireExaminer()
    const userId = session.id

    const [notifications, messages] = await Promise.all([
      prismaUnfiltered.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          title: true,
          message: true,
          type: true,
          isRead: true,
          createdAt: true,
          linkUrl: true,
        },
      }),
      prismaUnfiltered.message.findMany({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          subject: true,
          body: true,
          isRead: true,
          createdAt: true,
          sender: {
            select: {
              email: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),
    ])

    const transformedMessages = messages.map((msg) => ({
      ...msg,
      sender: {
        name: msg.sender.profile
          ? `${msg.sender.profile.firstName} ${msg.sender.profile.lastName}`
          : null,
        email: msg.sender.email,
      },
    }))

    return NextResponse.json({ notifications, messages: transformedMessages })
  } catch (error) {
    console.error('Examiner topbar items error:', error)
    return NextResponse.json({ notifications: [], messages: [] })
  }
}
