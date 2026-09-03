'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, Mail, CheckCircle2, AlertTriangle, XCircle, Info, Siren } from 'lucide-react'
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

export interface TopbarNotification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: Date
  linkUrl?: string | null
}

export interface TopbarMessage {
  id: string
  subject: string | null
  body: string
  isRead: boolean
  createdAt: Date
  sender: {
    name: string | null
    email: string
  }
}

const notificationTypeIcons: Record<string, { icon: typeof Info; className: string }> = {
  SUCCESS: { icon: CheckCircle2, className: 'text-emerald-500' },
  WARNING: { icon: AlertTriangle, className: 'text-amber-500' },
  ERROR: { icon: XCircle, className: 'text-red-500' },
  INFO: { icon: Info, className: 'text-blue-500' },
}

function formatBadge(count: number): string {
  return count > 9 ? '9+' : String(count)
}

export default function StudentTopbarActions() {
  const { counts } = useBadgeCounts()
  const [notifications, setNotifications] = useState<TopbarNotification[]>([])
  const [messages, setMessages] = useState<TopbarMessage[]>([])

  useEffect(() => {
    fetch('/api/student/topbar-items')
      .then((r) => (r.ok ? r.json() : { notifications: [], messages: [] }))
      .then((data) => {
        setNotifications(data.notifications ?? [])
        setMessages(data.messages ?? [])
      })
      .catch(() => {})
  }, [])

  const unreadNotifCount = counts.notifications ?? 0
  const unreadMsgCount = counts.messages ?? 0

  return (
    <div className="flex items-center gap-1.5">
      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="border-border/50 bg-background hover:bg-accent relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
            aria-label="Notifications"
          >
            <Bell className="text-muted-foreground h-4 w-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {formatBadge(unreadNotifCount)}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            {unreadNotifCount > 0 && (
              <span className="text-muted-foreground text-xs font-normal">
                {unreadNotifCount} unread
              </span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {notifications.length === 0 ? (
            <div className="text-muted-foreground px-4 py-6 text-center text-sm">
              No notifications
            </div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {notifications.map((notif) => {
                const typeConfig = notificationTypeIcons[notif.type] || notificationTypeIcons.INFO
                const TypeIcon = typeConfig.icon
                return (
                  <DropdownMenuItem key={notif.id} asChild>
                    <Link
                      href={notif.linkUrl || '/student/notifications'}
                      className="flex items-start gap-3 px-3 py-2.5"
                    >
                      <TypeIcon className={`mt-0.5 h-4 w-4 shrink-0 ${typeConfig.className}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm ${!notif.isRead ? 'font-semibold' : ''}`}>
                          {notif.title}
                        </p>
                        <p className="text-muted-foreground mt-0.5 truncate text-xs">
                          {notif.message}
                        </p>
                        <p className="text-muted-foreground/60 mt-1 text-[11px]">
                          {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      {!notif.isRead && (
                        <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                      )}
                    </Link>
                  </DropdownMenuItem>
                )
              })}
            </div>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link
              href="/student/notifications"
              className="text-primary justify-center text-center text-sm font-medium"
            >
              View All Notifications
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <button
        onClick={() => window.dispatchEvent(new CustomEvent('start-app-tour'))}
        className="border-border/50 bg-background hover:bg-accent relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
        aria-label="Help"
        title="Take a tour"
      >
        <Info className="text-muted-foreground h-4 w-4" />
      </button>

      {/* Messages */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="border-border/50 bg-background hover:bg-accent relative flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
            aria-label="Messages"
          >
            <Mail className="text-muted-foreground h-4 w-4" />
            {unreadMsgCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                {formatBadge(unreadMsgCount)}
              </span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Messages</span>
            <Link
              href="/student/messages?compose=true"
              className="text-primary text-xs font-normal hover:underline"
            >
              New Message
            </Link>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {messages.length === 0 ? (
            <div className="text-muted-foreground px-4 py-6 text-center text-sm">No messages</div>
          ) : (
            <div className="max-h-[300px] overflow-y-auto">
              {messages.map((msg) => (
                <DropdownMenuItem key={msg.id} asChild>
                  <Link
                    href={`/student/messages?thread=${msg.id}`}
                    className="flex items-start gap-3 px-3 py-2.5"
                  >
                    <div className="bg-muted text-muted-foreground flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold uppercase">
                      {msg.sender.name ? msg.sender.name.substring(0, 2) : '??'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-sm ${!msg.isRead ? 'font-semibold' : ''}`}>
                        {msg.sender.name || msg.sender.email}
                      </p>
                      <p className="text-muted-foreground mt-0.5 truncate text-xs">
                        {msg.subject || msg.body.substring(0, 60)}
                      </p>
                      <p className="text-muted-foreground/60 mt-1 text-[11px]">
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
              href="/student/messages"
              className="text-primary justify-center text-center text-sm font-medium"
            >
              View All Messages
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
