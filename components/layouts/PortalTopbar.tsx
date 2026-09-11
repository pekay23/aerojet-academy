'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Bell,
  MessageSquare,
  Info,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  Mail,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'

function formatBadge(count: number): string {
  return count > 99 ? '99+' : String(count)
}

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  if (!now) return null

  return (
    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
      {now.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })}
      <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
      {now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
    </span>
  )
}

const notifTypeIcons: Record<string, { icon: typeof Info; className: string }> = {
  SUCCESS: { icon: CheckCircle2, className: 'text-emerald-500' },
  WARNING: { icon: AlertTriangle, className: 'text-amber-500' },
  ERROR: { icon: XCircle, className: 'text-red-500' },
  INFO: { icon: Info, className: 'text-blue-500' },
  CRITICAL: { icon: AlertTriangle, className: 'text-red-600' },
}

export interface TopbarNotification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string | Date
  linkUrl?: string | null
}

export interface TopbarMessage {
  id: string
  subject: string | null
  body: string
  isRead: boolean
  createdAt: string | Date
  sender: { name: string | null; email: string }
}

interface TopbarItemsResponse {
  notifications: TopbarNotification[]
  messages: TopbarMessage[]
}

interface PortalTopbarProps {
  /** Endpoint that returns { notifications: [...], messages: [...] } */
  itemsEndpoint?: string
  /** Extra ReactNode rendered in the right section, e.g. a TourTrigger */
  actions?: React.ReactNode
  /** Href for "View All Notifications" link in the notifications dropdown */
  notificationsHref?: string
  /** Href for "View All Messages" link in the messages dropdown */
  messagesHref?: string
  /** Href for "New Message" compose link in the messages dropdown */
  composeHref?: string
  /** Async callback when user dismisses a notification. Should throw on error. */
  onDismissNotification?: (id: string) => Promise<void>
  /** Async callback when user clicks a message to mark it as read. */
  onMarkMessageRead?: (id: string) => Promise<void>
  /** Async callback when user clicks "Mark all read" for messages. */
  onMarkAllMessagesRead?: (ids: string[]) => Promise<void>
  /** Show a welcome message next to the breadcrumb (xl breakpoint) */
  welcomeMessage?: string | null
  userName?: string
}

export default function PortalTopbar({
  itemsEndpoint,
  actions,
  notificationsHref = '#',
  messagesHref = '#',
  composeHref,
  onDismissNotification,
  onMarkMessageRead,
  onMarkAllMessagesRead,
  welcomeMessage,
  userName,
}: PortalTopbarProps) {
  const [notifications, setNotifications] = useState<TopbarNotification[]>([])
  const [messages, setMessages] = useState<TopbarMessage[]>([])
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!itemsEndpoint) return
    fetch(itemsEndpoint)
      .then((r) => (r.ok ? r.json() : { notifications: [], messages: [] }))
      .then((data: TopbarItemsResponse) => {
        setNotifications(data.notifications ?? [])
        setMessages(data.messages ?? [])
      })
      .catch(() => {})
  }, [itemsEndpoint])

  const unreadNotifCount = notifications.filter((n) => !n.isRead).length
  const unreadMsgCount = messages.filter((m) => !m.isRead).length

  const handleDismissNotification = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (dismissingIds.has(id) || !onDismissNotification) return

      const item = notifications.find((n) => n.id === id)
      setDismissingIds((prev) => new Set(prev).add(id))
      setNotifications((prev) => prev.filter((n) => n.id !== id))

      try {
        await onDismissNotification(id)
      } catch {
        if (item) setNotifications((prev) => [...prev, item])
      } finally {
        setDismissingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    [dismissingIds, notifications, onDismissNotification]
  )

  const handleMarkMessageAsRead = useCallback(
    async (msgId: string) => {
      setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, isRead: true } : m)))
      if (onMarkMessageRead) {
        try {
          await onMarkMessageRead(msgId)
        } catch {
          // Silently fail
        }
      }
    },
    [onMarkMessageRead]
  )

  const handleMarkAllMessagesRead = useCallback(async () => {
    const unreadIds = messages.filter((m) => !m.isRead).map((m) => m.id)
    if (unreadIds.length === 0) return
    setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })))
    if (onMarkAllMessagesRead) {
      try {
        await onMarkAllMessagesRead(unreadIds)
      } catch {
        // Revert
      }
    }
  }, [messages, onMarkAllMessagesRead])

  const getSenderInitials = (name: string | null, email: string) => {
    if (name) return name.substring(0, 2).toUpperCase()
    return email.substring(0, 2).toUpperCase()
  }

  return (
    <div className="sticky top-0 z-30 hidden items-center justify-between border-b border-slate-200 bg-white/80 px-6 shadow-xs backdrop-blur-lg lg:flex dark:border-slate-700 dark:bg-slate-900/80">
      {/* Left section */}
      <div className="flex h-12 items-center gap-4">
        <BreadcrumbNav />

        {/* Welcome message — only shown on xl+ */}
        {(welcomeMessage || userName) && (
          <div className="hidden max-w-md items-center gap-2 xl:flex">
            <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <p className="truncate text-xs text-slate-500 italic dark:text-slate-400">
              {userName && (
                <span className="font-medium text-slate-500 not-italic dark:text-slate-400">
                  Hi {userName}
                </span>
              )}
              {userName && welcomeMessage && <span className="mx-1">—</span>}
              {welcomeMessage}
            </p>
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        <LiveClock />

        {actions && (
          <>
            {actions}
            <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
          </>
        )}

        {/* Notifications dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all duration-150 ease-out hover:border-slate-200 hover:bg-white hover:text-slate-600 hover:shadow-sm dark:hover:border-slate-700 dark:hover:bg-slate-800/80 dark:hover:text-slate-300"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {formatBadge(unreadNotifCount)}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {unreadNotifCount > 0 && (
                <span className="text-xs font-normal text-slate-400">
                  {unreadNotifCount} unread
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">No notifications</div>
            ) : (
              <div className="max-h-[340px] overflow-y-auto">
                {notifications.map((n) => {
                  const cfg = notifTypeIcons[n.type] || notifTypeIcons.INFO
                  const TypeIcon = cfg.icon
                  const isDismissing = dismissingIds.has(n.id)
                  return (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-3 py-2 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        isDismissing ? 'opacity-50' : ''
                      }`}
                    >
                      <Link
                        href={`${n.linkUrl || notificationsHref}?returnUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.pathname + window.location.search : '/student/dashboard')}`}
                        className="flex min-w-0 flex-1 items-start gap-3"
                      >
                        <TypeIcon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.className}`} />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-sm ${!n.isRead ? 'font-semibold' : ''} text-slate-700 dark:text-slate-200`}
                          >
                            {n.title}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-400">{n.message}</p>
                          <p className="mt-0.5 text-[11px] text-slate-400/60">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!n.isRead && (
                          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        )}
                      </Link>
                      {onDismissNotification && (
                        <button
                          onClick={(e) => handleDismissNotification(n.id, e)}
                          disabled={isDismissing}
                          className="mt-1 shrink-0 rounded-md p-1 text-slate-300 transition-colors hover:bg-slate-100 hover:text-red-500 disabled:opacity-50 dark:hover:bg-slate-800"
                          title="Dismiss"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {notificationsHref !== '#' && notifications.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={notificationsHref}
                    className="text-aerojet-sky justify-center text-center text-xs font-medium"
                  >
                    View All Notifications
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Messages dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition-all duration-150 ease-out hover:border-slate-200 hover:bg-white hover:text-slate-600 hover:shadow-sm dark:hover:border-slate-700 dark:hover:bg-slate-800/80 dark:hover:text-slate-300"
              aria-label="Messages"
            >
              <MessageSquare className="h-4 w-4" />
              {unreadMsgCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white">
                  {formatBadge(unreadMsgCount)}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Messages</span>
              <div className="flex items-center gap-2">
                {messages.filter((m) => !m.isRead).length > 0 && (
                  <button
                    onClick={handleMarkAllMessagesRead}
                    className="hover:text-aerojet-sky text-[10px] font-bold tracking-wider text-slate-400 uppercase transition-colors"
                  >
                    Mark all read
                  </button>
                )}
                {composeHref && (
                  <Link
                    href={composeHref}
                    className="text-aerojet-sky text-xs font-normal hover:underline"
                  >
                    New Message
                  </Link>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {messages.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
                  <Mail className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                  No messages yet
                </p>
                <p className="mt-1 text-xs text-slate-400">Conversations will appear here</p>
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                {messages.map((msg) => {
                  const preview = msg.subject || msg.body.substring(0, 60)
                  const senderName = msg.sender.name || msg.sender.email
                  const initials = getSenderInitials(msg.sender.name, msg.sender.email)
                  return (
                    <DropdownMenuItem
                      key={msg.id}
                      onSelect={() => handleMarkMessageAsRead(msg.id)}
                      asChild
                    >
                      <Link
                        href={`${messagesHref}?thread=${msg.id}`}
                        className={`flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                          !msg.isRead ? 'bg-blue-50/40 dark:bg-blue-900/5' : ''
                        }`}
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 uppercase dark:bg-slate-800 dark:text-slate-400">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate text-sm ${!msg.isRead ? 'font-semibold text-slate-900 dark:text-slate-100' : 'text-slate-700 dark:text-slate-200'}`}
                          >
                            {senderName}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                            {preview}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-400/60">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!msg.isRead && (
                          <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                        )}
                      </Link>
                    </DropdownMenuItem>
                  )
                })}
              </div>
            )}
            {messagesHref !== '#' && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href={messagesHref}
                    className="text-aerojet-sky justify-center text-center text-sm font-medium"
                  >
                    View All Messages
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
