'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Clock,
  CornerDownRight,
  Send,
  Loader2,
  User,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { sendStaffMessage, markMessageAsRead } from '../../actions'
import { Badge } from '@/components/ui/badge'
import { PresencePill } from '@/components/shared/PresencePill'

type MessageUser = {
  id: string
  email: string
  role: string
  profile?: { firstName: string; lastName: string; profilePhotoUrl?: string | null } | null
}

type Message = {
  id: string
  senderId: string
  recipientId: string
  subject: string | null
  body: string
  isRead: boolean
  createdAt: Date
  replyToId: string | null
  sender: MessageUser
  recipient: MessageUser
}

type Thread = {
  root: Message
  replies: Message[]
  unreadCount: number
}

interface StaffMessageThreadProps {
  thread: Thread
  currentUserId: string
  recipients: { id: string; email: string; label: string }[]
}

function formatTime(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const hours = diff / (1000 * 60 * 60)
  if (hours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (hours < 168)
    return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function userName(user: MessageUser) {
  return user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email
}

function MessageBubble({
  message,
  isOwn,
  onReply,
}: {
  message: Message
  isOwn: boolean
  onReply: (msg: Message) => void
}) {
  const displayName = isOwn ? 'You' : userName(message.sender)
  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white shadow-sm ring-2 ring-white dark:ring-slate-900 ${
          isOwn ? 'bg-aerojet-blue' : 'bg-slate-400'
        }`}
      >
        {userName(message.sender).charAt(0).toUpperCase()}
      </div>
      <div
        className={`group max-w-[80%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1.5`}
      >
        <p
          className={`text-[10px] font-black tracking-widest text-slate-400 uppercase ${isOwn ? 'text-right' : 'text-left'}`}
        >
          {displayName} · {formatTime(message.createdAt)}
        </p>
        <div
          className={`rounded-2xl px-5 py-3 text-sm leading-relaxed shadow-sm ${
            isOwn
              ? 'rounded-tr-sm bg-aerojet-blue font-medium text-white shadow-blue-500/10'
              : 'rounded-tl-sm bg-slate-100 font-medium text-slate-800 dark:bg-slate-800 dark:text-slate-100'
          }`}
        >
          {message.body}
        </div>
        {!isOwn && (
          <button
            onClick={() => onReply(message)}
            className="flex items-center gap-1.5 text-[10px] font-black tracking-widest text-slate-400 uppercase opacity-0 transition-opacity group-hover:opacity-100 hover:text-aerojet-blue dark:hover:text-blue-400"
          >
            <CornerDownRight className="h-3 w-3" />
            Reply
          </button>
        )}
      </div>
    </div>
  )
}

export default function StaffMessageThread({
  thread,
  currentUserId,
  recipients,
}: StaffMessageThreadProps) {
  const [expanded, setExpanded] = useState(thread.unreadCount > 0)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const router = useRouter()

  const allMessages = [thread.root, ...thread.replies].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  )

  const otherParticipant =
    thread.root.senderId === currentUserId ? thread.root.recipient : thread.root.sender
  const subjectDisplay = thread.root.subject || '(No subject)'

  async function handleExpand() {
    if (!expanded) {
      const unreadIds = allMessages
        .filter((m) => m.recipientId === currentUserId && !m.isRead)
        .map((m) => m.id)
      for (const id of unreadIds) {
        await markMessageAsRead(id)
      }
      router.refresh()
    }
    setExpanded(!expanded)
  }

  async function handleSendReply() {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const replySubject = subjectDisplay.startsWith('Re: ')
        ? subjectDisplay
        : `Re: ${subjectDisplay}`
      const res = await sendStaffMessage(otherParticipant.id, replySubject, replyText.trim())
      if (!res || res.error) {
        toast.error(res?.error ?? 'Failed to send reply')
        return
      }
      toast.success('Reply sent')
      setReplyText('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className={`rounded-3xl border bg-white shadow-sm transition-all hover:shadow-md dark:bg-slate-900 ${
        thread.unreadCount > 0
          ? 'border-blue-200 bg-blue-50/10 ring-2 ring-blue-500/5 dark:border-blue-900 dark:bg-blue-900/10'
          : 'border-slate-100 dark:border-slate-800'
      }`}
    >
      {/* Header */}
      <button
        onClick={handleExpand}
        className="group flex w-full items-center gap-5 px-6 py-5 text-left"
      >
        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black text-white shadow-xl transition-transform group-hover:scale-110 ${
            thread.root.senderId === currentUserId ? 'bg-aerojet-blue' : 'bg-slate-500'
          }`}
        >
          {userName(otherParticipant).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 space-y-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <p className="truncate text-base font-black text-aerojet-blue dark:text-slate-100">
              {userName(otherParticipant)}
            </p>
            <PresencePill peerId={otherParticipant.id} />
            <Badge
              variant="outline"
              className="rounded-md border-slate-200 px-1.5 py-0 text-[9px] font-black tracking-widest text-slate-400 uppercase dark:border-slate-700"
            >
              {otherParticipant.role}
            </Badge>
            {thread.unreadCount > 0 && (
              <span className="shrink-0 animate-pulse rounded-full bg-red-500 px-2 py-0.5 text-[9px] font-black tracking-widest text-white uppercase shadow-lg">
                New
              </span>
            )}
          </div>
          <p className="truncate text-sm font-bold text-slate-700 dark:text-slate-300">
            {subjectDisplay}
          </p>
          <p className="truncate text-xs font-medium text-slate-400">
            {allMessages[allMessages.length - 1].body}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2.5">
          <span className="flex items-center gap-1.5 font-mono text-[10px] font-black tracking-widest text-slate-400 uppercase">
            <Clock className="h-3 w-3" />
            {formatTime(allMessages[allMessages.length - 1].createdAt)}
          </span>
          {allMessages.length > 1 && (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black tracking-widest text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400">
              {allMessages.length} Messages
            </span>
          )}
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-slate-300 transition-transform group-hover:text-slate-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-300 transition-transform group-hover:text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded conversation */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/30 px-6 py-6 dark:border-slate-800 dark:bg-slate-800/20">
          <div className="space-y-6">
            {allMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUserId}
                onReply={() => {}}
              />
            ))}
          </div>

          {/* Reply box */}
          <div className="mt-8 flex gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendReply())
                }
                placeholder={`Type a message to ${userName(otherParticipant)}…`}
                className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-medium text-slate-900 placeholder-slate-400 shadow-sm transition-all focus:border-aerojet-blue focus:ring-4 focus:ring-aerojet-blue/5 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-900 dark:focus:ring-blue-500/5"
              />
            </div>
            <button
              onClick={handleSendReply}
              disabled={sending || !replyText.trim()}
              className="group flex items-center justify-center rounded-2xl bg-aerojet-blue px-6 text-white shadow-xl transition-all hover:scale-105 hover:bg-[#003875] disabled:scale-100 disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
