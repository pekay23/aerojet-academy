'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Bell,
  MessageSquare,
  UserPlus,
  CreditCard,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
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
import { useBadgeCounts } from '@/hooks/useBadgeCounts'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'

interface StaffTopBarProps {
  initialCounts: {
    applicants: number
    payments: number
    enrollments: number
    messages: number
    notifications: number
  }
  welcomeMessages?: string[]
  userName?: string
}

interface TopbarNotification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date
  linkUrl?: string | null
}

interface TopbarMessage {
  id: string
  subject: string | null
  body: string
  isRead: boolean
  createdAt: Date
  sender: { name: string | null; email: string }
}

interface PendingItems {
  applicants: { id: string; name: string | null; email: string; createdAt: Date }[]
  payments: { id: string; userName: string; amount: number; currency: string; createdAt: Date }[]
  enrollments: { id: string; userName: string; courseName: string; createdAt: Date }[]
}

const notifTypeIcons: Record<string, { icon: typeof Info; className: string }> = {
  SUCCESS: { icon: CheckCircle2, className: 'text-emerald-500' },
  WARNING: { icon: AlertTriangle, className: 'text-amber-500' },
  ERROR: { icon: XCircle, className: 'text-red-500' },
  INFO: { icon: Info, className: 'text-blue-500' },
}

function formatBadge(count: number): string {
  return count > 99 ? '99+' : String(count)
}

function LiveClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(interval)
  }, [])

  if (!now) return null

  return (
    <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
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

export default function StaffTopBar({ initialCounts, welcomeMessages, userName }: StaffTopBarProps) {
  const [welcomeMsg, setWelcomeMsg] = useState<string | null>(null)

  useEffect(() => {
    if (welcomeMessages?.length) {
      const idx = Math.floor(Math.random() * welcomeMessages.length)
      setWelcomeMsg(welcomeMessages[idx] ?? welcomeMessages[0])
    }
  }, [welcomeMessages])

  const { counts } = useBadgeCounts({
    notifications: initialCounts.notifications,
    messages: initialCounts.messages,
    applicants: initialCounts.applicants,
    enrollments: initialCounts.enrollments,
    payments: initialCounts.payments,
  })

  const [notifications, setNotifications] = useState<TopbarNotification[]>([])
  const [messages, setMessages] = useState<TopbarMessage[]>([])
  const [pendingItems, setPendingItems] = useState<PendingItems>({
    applicants: [],
    payments: [],
    enrollments: [],
  })

  useEffect(() => {
    fetch('/api/staff/topbar-items')
      .then((r) =>
        r.ok
          ? r.json()
          : { notifications: [], messages: [], pendingItems: { applicants: [], payments: [], enrollments: [] } }
      )
      .then((data) => {
        setNotifications(data.notifications ?? [])
        setMessages(data.messages ?? [])
        setPendingItems(
          data.pendingItems ?? { applicants: [], payments: [], enrollments: [] }
        )
      })
      .catch(() => {})
  }, [])

  const notifCount =
    (counts.applicants ?? 0) +
    (counts.payments ?? 0) +
    (counts.enrollments ?? 0) +
    (counts.notifications ?? 0)
  const msgCount = counts.messages ?? 0

  const hasPendingApplicants = pendingItems.applicants.length > 0
  const hasPendingPayments = pendingItems.payments.length > 0
  const hasPendingEnrollments = pendingItems.enrollments.length > 0
  const hasNotifications = notifications.length > 0
  const hasAnyPending = hasPendingApplicants || hasPendingPayments || hasPendingEnrollments || hasNotifications

  return (
    <div className="sticky top-0 z-30 hidden items-center justify-between border-b border-slate-200 bg-white/80 px-6 shadow-xs backdrop-blur-lg lg:flex dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex h-12 items-center gap-4">
        <BreadcrumbNav />
        {welcomeMsg && (
          <div className="hidden max-w-md items-center gap-2 xl:flex">
            <span className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
            <p className="truncate text-xs text-slate-400 italic dark:text-slate-500">
              {userName && <span className="not-italic font-medium text-slate-500 dark:text-slate-400">Hi {userName}</span>}
              {userName && <span className="mx-1">—</span>}
              {welcomeMsg}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <LiveClock />

        {/* Notifications / Pending Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              aria-label="Pending actions"
            >
              <Bell className="h-4 w-4" />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                  {formatBadge(notifCount)}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Pending Actions</span>
              {notifCount > 0 && (
                <span className="text-xs font-normal text-slate-400">
                  {notifCount} pending
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {!hasAnyPending ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                No pending actions
              </div>
            ) : (
              <div className="max-h-[340px] overflow-y-auto">
                {/* Pending Applicants */}
                {hasPendingApplicants && (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Applicants
                    </div>
                    {pendingItems.applicants.map((a) => (
                      <DropdownMenuItem key={a.id} asChild>
                        <Link
                          href="/staff/users?tab=applicants"
                          className="flex items-start gap-3 px-3 py-2"
                        >
                          <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {a.name || a.email}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

                {/* Pending Payments */}
                {hasPendingPayments && (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Payments
                    </div>
                    {pendingItems.payments.map((p) => (
                      <DropdownMenuItem key={p.id} asChild>
                        <Link
                          href="/staff/payments?tab=PENDING"
                          className="flex items-start gap-3 px-3 py-2"
                        >
                          <CreditCard className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {p.userName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {p.currency} {p.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                              {' · '}
                              {formatDistanceToNow(new Date(p.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

                {/* Pending Enrollments */}
                {hasPendingEnrollments && (
                  <>
                    <div className="px-3 py-1.5 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Enrollments
                    </div>
                    {pendingItems.enrollments.map((e) => (
                      <DropdownMenuItem key={e.id} asChild>
                        <Link
                          href="/staff/enrollments?status=PENDING"
                          className="flex items-start gap-3 px-3 py-2"
                        >
                          <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-purple-500" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {e.userName}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {e.courseName}
                              {' · '}
                              {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </>
                )}

                {/* Generic Notifications */}
                {hasNotifications && (
                  <>
                    <DropdownMenuSeparator />
                    <div className="px-3 py-1.5 text-[10px] font-black tracking-wider text-slate-400 uppercase">
                      Notifications
                    </div>
                    {notifications.map((n) => {
                      const cfg = notifTypeIcons[n.type] || notifTypeIcons.INFO
                      const TypeIcon = cfg.icon
                      return (
                        <DropdownMenuItem key={n.id} asChild>
                          <Link
                            href={n.linkUrl || '/staff'}
                            className="flex items-start gap-3 px-3 py-2"
                          >
                            <TypeIcon className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.className}`} />
                            <div className="min-w-0 flex-1">
                              <p
                                className={`truncate text-sm ${!n.isRead ? 'font-semibold' : ''} text-slate-700 dark:text-slate-200`}
                              >
                                {n.title}
                              </p>
                              <p className="mt-0.5 truncate text-xs text-slate-400">
                                {n.message}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-400/60">
                                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                              </p>
                            </div>
                            {!n.isRead && (
                              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                            )}
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}
                  </>
                )}
              </div>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/staff/payments?tab=PENDING"
                className="justify-center text-center text-sm font-medium text-[#4c9ded]"
              >
                View All Pending
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Messages */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
              aria-label="Messages"
            >
              <MessageSquare className="h-4 w-4" />
              {msgCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500 px-1 text-[9px] font-bold text-white">
                  {formatBadge(msgCount)}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Messages</span>
              <Link
                href="/staff/messages?compose=true"
                className="text-xs font-normal text-[#4c9ded] hover:underline"
              >
                New Message
              </Link>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {messages.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-slate-400">
                No messages
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                {messages.map((msg) => (
                  <DropdownMenuItem key={msg.id} asChild>
                    <Link
                      href={`/staff/messages?thread=${msg.id}`}
                      className="flex items-start gap-3 px-3 py-2.5"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        {msg.sender.name ? msg.sender.name.substring(0, 2) : '??'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`truncate text-sm ${!msg.isRead ? 'font-semibold' : ''} text-slate-700 dark:text-slate-200`}
                        >
                          {msg.sender.name || msg.sender.email}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-slate-400">
                          {msg.subject || msg.body.substring(0, 60)}
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
                ))}
              </div>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/staff/messages"
                className="justify-center text-center text-sm font-medium text-[#4c9ded]"
              >
                View All Messages
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
