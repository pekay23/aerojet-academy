'use client'

import { useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  CornerDownRight,
  Send,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { sendMessage } from '../../actions'
import { markMessageAsRead } from '../../actions'
import { PresencePill } from '@/components/shared/PresencePill'

type MessageUser = {
  id: string
  email: string
  profile?: { firstName: string; lastName: string } | null
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

interface MessageThreadProps {
  thread: Thread
  currentUserId: string
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
  return (
    <div className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${isOwn ? 'bg-blue-800' : 'bg-slate-400'}`}
      >
        {userName(isOwn ? message.sender : message.recipient)
          .charAt(0)
          .toUpperCase()}
      </div>
      <div
        className={`group max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}
      >
        <p
          className={`text-xs text-slate-500 dark:text-slate-400 ${isOwn ? 'text-right' : 'text-left'}`}
        >
          {isOwn ? 'You' : userName(message.sender)} · {formatTime(message.createdAt)}
        </p>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isOwn
              ? 'rounded-tr-sm bg-blue-800 text-white'
              : 'rounded-tl-sm bg-slate-100 text-slate-800'
          }`}
        >
          {message.body}
        </div>
        {!isOwn && (
          <button
            onClick={() => onReply(message)}
            className="flex items-center gap-1 text-xs text-slate-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-blue-800"
          >
            <CornerDownRight className="h-3 w-3" />
            Reply
          </button>
        )}
      </div>
    </div>
  )
}

export default function MessageThread({ thread, currentUserId }: MessageThreadProps) {
  const [expanded, setExpanded] = useState(thread.unreadCount > 0)
  const [_replyTo, setReplyTo] = useState<Message | null>(null)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  // Optimistic local unread count — zeroed immediately on open so the badge
  // disappears without waiting for a round-trip or page refresh.
  const [localUnreadCount, setLocalUnreadCount] = useState(thread.unreadCount)
  const router = useRouter()

  const allMessages = [thread.root, ...thread.replies].sort(
    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
  )

  const otherParticipant =
    thread.root.senderId === currentUserId ? thread.root.recipient : thread.root.sender
  const subjectDisplay = thread.root.subject || '(No subject)'

  async function markThreadRead() {
    if (localUnreadCount === 0) return
    // Clear badge immediately (optimistic)
    setLocalUnreadCount(0)
    const unreadIds = allMessages
      .filter((m) => m.recipientId === currentUserId && !m.isRead)
      .map((m) => m.id)
    if (unreadIds.length > 0) {
      await Promise.all(unreadIds.map((id) => markMessageAsRead(id)))
      router.refresh()
    }
  }

  async function handleExpand() {
    const opening = !expanded
    setExpanded(opening)
    if (opening) {
      await markThreadRead()
    }
  }

  async function handleSendReply() {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await sendMessage(
        otherParticipant.id,
        subjectDisplay.startsWith('Re: ') ? subjectDisplay : `Re: ${subjectDisplay}`,
        replyText.trim()
      )
      if (!res || res.error) {
        toast.error(res?.error ?? 'Failed to send reply')
        return
      }
      toast.success('Reply sent')
      setReplyText('')
      setReplyTo(null)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reply')
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className={`rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md dark:bg-slate-900 ${
        localUnreadCount > 0 ? 'border-blue-200' : 'border-slate-100'
      }`}
    >
      {/* Thread header – click to expand */}
      <button onClick={handleExpand} className="flex w-full items-center gap-4 px-5 py-4 text-left">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
            thread.root.senderId === currentUserId ? 'bg-blue-800' : 'bg-slate-500'
          }`}
        >
          {userName(otherParticipant).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-slate-900 dark:text-slate-100">
              {userName(otherParticipant)}
            </p>
            <PresencePill peerId={otherParticipant.id} />
            {localUnreadCount > 0 && (
              <span className="shrink-0 rounded-full bg-blue-500 px-1.5 py-0.5 text-xs font-bold text-white">
                {localUnreadCount} new
              </span>
            )}
          </div>
          <p className="truncate text-sm font-semibold text-slate-700">{subjectDisplay}</p>
          <p className="truncate text-xs text-slate-400">
            {allMessages[allMessages.length - 1].body}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-xs text-slate-400">
            {formatTime(allMessages[allMessages.length - 1].createdAt)}
          </span>
          {allMessages.length > 1 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              {allMessages.length} msgs
            </span>
          )}
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded conversation */}
      {expanded && (
        <div
          className="border-t border-slate-100 px-5 pt-4 pb-4 dark:border-slate-800"
          onClick={markThreadRead}
        >
          <div className="space-y-4">
            {allMessages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isOwn={msg.senderId === currentUserId}
                onReply={setReplyTo}
              />
            ))}
          </div>

          {/* Reply box */}
          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) =>
                e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendReply())
              }
              placeholder={`Reply to ${userName(otherParticipant)}…`}
              className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-800 focus:ring-2 focus:ring-blue-800/20 focus:outline-none dark:border-slate-700 dark:text-slate-100"
            />
            <button
              onClick={handleSendReply}
              disabled={sending || !replyText.trim()}
              className="flex items-center gap-1.5 rounded-xl bg-blue-800 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#003875] disabled:opacity-50"
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
