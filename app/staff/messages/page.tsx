import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Mail, Send, Inbox } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import { getStaffRecipients } from '../actions'
import StaffNewMessageDialog from './_components/StaffNewMessageDialog'
import StaffMessageThread from './_components/StaffMessageThread'
import AutoRefresh from '@/components/AutoRefresh'

export const metadata: Metadata = { title: 'Messages | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function StaffMessagesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const [recipients, messages] = await Promise.all([
    getStaffRecipients(),
    prisma.message.findMany({
      where: {
        OR: [{ recipientId: userId }, { senderId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { firstName: true, lastName: true, profilePhotoUrl: true } },
          },
        },
        recipient: {
          select: {
            id: true,
            email: true,
            role: true,
            profile: { select: { firstName: true, lastName: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  type Msg = (typeof messages)[number]

  function getThreadKey(msg: Msg): string {
    const participants = [msg.senderId, msg.recipientId].sort().join('|')
    const baseSubject = (msg.subject ?? '')
      .replace(/^Re:\s*/i, '')
      .trim()
      .toLowerCase()
    return `${participants}::${baseSubject}`
  }

  const threadMap = new Map<string, { root: Msg; replies: Msg[]; unreadCount: number }>()

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

  const threads = [...threadMap.values()].sort((a, b) => {
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1
    if (b.unreadCount > 0 && a.unreadCount === 0) return 1
    const aLast = a.replies.at(-1)?.createdAt ?? a.root.createdAt
    const bLast = b.replies.at(-1)?.createdAt ?? b.root.createdAt
    return bLast.getTime() - aLast.getTime()
  })

  const totalUnread = threads.reduce((sum, t) => sum + t.unreadCount, 0)

  return (
    <div className="space-y-6">
      <AutoRefresh intervalMs={20000} />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
            Messages
            {totalUnread > 0 && (
              <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
                {totalUnread}
              </span>
            )}
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Communicate with students, instructors, and staff.
          </p>
        </div>
        <StaffNewMessageDialog recipients={recipients} />
      </div>

      {threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
            <Mail className="h-8 w-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">No Messages</h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            No conversations yet. Send a message to get started.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread, i) => (
            <StaffMessageThread
              key={`${thread.root.id}-${i}`}
              thread={thread}
              currentUserId={userId}
              recipients={recipients}
            />
          ))}
        </div>
      )}
    </div>
  )
}
