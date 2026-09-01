import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { Mail, Send, Inbox, Sparkles } from 'lucide-react'

import { getAuthSession } from '@/lib/auth/helpers'
import { prismaUnfiltered } from '@/lib/prisma/client'
import { getStaffRecipients } from '../actions'
import StaffNewMessageDialog from './_components/StaffNewMessageDialog'
import StaffMessageThread from './_components/StaffMessageThread'
import AutoRefresh from '@/components/AutoRefresh'
import MessagesRealtime from '@/components/shared/MessagesRealtime'

export const metadata: Metadata = { title: 'Messages | Staff Portal' }
export const dynamic = 'force-dynamic'

export default async function StaffMessagesPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const [recipients, messages] = await Promise.all([
    getStaffRecipients(),
    prismaUnfiltered.message.findMany({
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
    <div className="mx-auto max-w-[1920px] space-y-8">
      <MessagesRealtime userId={userId} />
      <AutoRefresh intervalMs={20000} />

      {/* Header */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-black tracking-tight text-aerojet-blue sm:text-4xl dark:text-slate-100">
            Messages
            {totalUnread > 0 && (
              <span className="flex h-7 min-w-[28px] items-center justify-center rounded-full bg-red-100 px-2 text-xs font-black text-red-700 shadow-lg ring-4 ring-white dark:bg-red-900/30 dark:text-red-400 dark:ring-slate-900">
                {totalUnread}
              </span>
            )}
          </h1>
          <p className="flex items-center gap-2 text-base font-medium text-slate-500 dark:text-slate-400">
            <Sparkles className="h-5 w-5 text-aerojet-sky" />
            Communicate with students, instructors, and academy staff.
          </p>
        </div>
        <StaffNewMessageDialog recipients={recipients} />
      </div>

      {threads.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-slate-100 bg-white p-20 text-center shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
            <Mail className="h-12 w-12 text-slate-300" />
          </div>
          <h3 className="text-xl font-black text-aerojet-blue dark:text-slate-100">
            No Messages Found
          </h3>
          <p className="mt-3 max-w-sm text-slate-500 dark:text-slate-400">
            Your initial conversations will appear here. Start by messaging a student or staff
            member.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mb-2 flex items-center justify-between px-2">
            <h3 className="text-sm font-black tracking-widest text-slate-400 uppercase">
              Recent Conversations
            </h3>
          </div>
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
        </div>
      )}
    </div>
  )
}
