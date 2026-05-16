import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Mail } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'

import { getAvailableRecipients } from '../actions'
import NewMessageDialog from './_components/NewMessageDialog'
import MessageThread from './_components/MessageThread'
import AutoRefresh from '@/components/AutoRefresh'

export const metadata: Metadata = {
  title: 'Messages | Student Portal',
  description: 'View and manage your messages.',
}
export const dynamic = 'force-dynamic'

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>
}) {
  const { subject: subjectParam } = await searchParams
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const [recipients, messages] = await Promise.all([
    getAvailableRecipients(),
    prisma.message.findMany({
      where: {
        OR: [{ recipientId: userId }, { senderId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    }),
  ])

  // Group messages into threads: keyed by the pair of participants + base subject
  type MessageWithUsers = (typeof messages)[number]

  function getThreadKey(msg: MessageWithUsers): string {
    const participants = [msg.senderId, msg.recipientId].sort().join('|')
    const baseSubject = (msg.subject ?? '')
      .replace(/^Re:\s*/i, '')
      .trim()
      .toLowerCase()
    return `${participants}::${baseSubject}`
  }

  const threadMap = new Map<
    string,
    { root: MessageWithUsers; replies: MessageWithUsers[]; unreadCount: number }
  >()

  for (const msg of messages) {
    const key = getThreadKey(msg)
    if (!threadMap.has(key)) {
      threadMap.set(key, { root: msg, replies: [], unreadCount: 0 })
    } else {
      threadMap.get(key)!.replies.push(msg)
    }
    if (msg.recipientId === userId && !msg.isRead) {
      threadMap.get(key)!.unreadCount++
    }
  }

  // Sort threads: unread first, then by most recent message
  const threads = [...threadMap.values()].sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1
    if (b.unreadCount > 0 && a.unreadCount === 0) return 1
    const aLast = a.replies.at(-1)?.createdAt ?? a.root.createdAt
    const bLast = b.replies.at(-1)?.createdAt ?? b.root.createdAt
    return bLast.getTime() - aLast.getTime()
  })

  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Auto-refresh every 60s */}
      <AutoRefresh intervalMs={60000} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
            Messages
            {totalUnread > 0 && (
              <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                {totalUnread}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your conversations with staff and instructors.
          </p>
        </div>
        <NewMessageDialog 
          recipients={recipients} 
          defaultSubject={subjectParam}
          defaultOpen={!!subjectParam} 
        />
      </div>

      {threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
            <Mail className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No Messages</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            You have no messages yet. Send one to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread, i) => (
            <MessageThread key={`${thread.root.id}-${i}`} thread={thread} currentUserId={userId} />
          ))}
        </div>
      )}
    </div>
  )
}
