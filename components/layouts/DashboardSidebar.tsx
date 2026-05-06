'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTheme } from '@/components/shared/theme-provider'
import {
  ChevronDown,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Home,
  PanelLeftClose,
  PanelLeft,
  Sun,
  Moon,
  Monitor,
} from 'lucide-react'
import { ElementType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export type SidebarLinkItem = {
  type?: 'link'
  label: string
  href: string
  icon?: ElementType
  badge?: number
  children?: { label: string; href: string }[]
}

export type SidebarLinkHeader = {
  type: 'header'
  label: string
  href?: never
  icon?: never
  badge?: never
  children?: never
}

export type SidebarLink = SidebarLinkItem | SidebarLinkHeader

function buildHref(basePath: string, href: string) {
  if (!basePath) return href
  if (href === basePath || href.startsWith(`${basePath}/`)) return href
  return `${basePath}${href}`
}

interface DashboardSidebarProps {
  links: SidebarLink[]
  portalLabel: string
  portalColor?: string
  userName?: string
  userRole?: string
  userImage?: string
  basePath?: string
  userMenuItems?: SidebarLinkItem[]
}

/* ── Mobile Top Bar with inline breadcrumb ─────────────────────────── */
function segmentToLabel(segment: string): string {
  if (segment.length > 20) return '...'
  return segment
    .replace(/\[.*?\]/g, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function MobileTopBar({
  portalLabel,
  onOpenMenu,
}: {
  portalLabel: string
  onOpenMenu: () => void
}) {
  const pathname = usePathname()
  const portalRoots = ['staff', 'student', 'instructor', 'applicant']
  const segments = pathname
    .split('/')
    .filter((s) => Boolean(s) && !s.startsWith('(') && !s.endsWith(')'))

  const subSegments =
    segments.length > 0 && portalRoots.includes(segments[0]) ? segments.slice(1) : segments

  const displaySegments = subSegments.length > 2 ? subSegments.slice(-2) : subSegments
  const currentPageLabel = displaySegments.length === 0 ? 'Dashboard' : null

  return (
    <div className="fixed top-0 right-0 left-0 z-40 flex items-center gap-3 border-b border-border/50 bg-white/80 px-4 py-3 backdrop-blur-lg lg:hidden dark:bg-slate-900/80">
      {/* Hamburger */}
      <button
        onClick={onOpenMenu}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md transition-transform active:scale-95 dark:bg-slate-700"
        aria-label="Open navigation menu"
      >
        <Menu className="h-4 w-4" aria-hidden="true" />
      </button>

      {/* Breadcrumb trail */}
      <nav className="flex min-w-0 items-center gap-1.5 overflow-hidden" aria-label="Breadcrumb">
        {currentPageLabel ? (
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
            {currentPageLabel}
          </span>
        ) : (
          displaySegments.map((segment, i) => {
            const isLast = i === displaySegments.length - 1
            const label = segmentToLabel(segment)

            return (
              <span key={i} className="flex shrink-0 items-center gap-1.5">
                {i > 0 && (
                  <span className="text-xs text-slate-300 dark:text-slate-600">/</span>
                )}
                <span
                  className={`max-w-[120px] truncate text-xs ${
                    isLast
                      ? 'font-bold text-slate-800 dark:text-slate-100'
                      : 'font-medium text-slate-400 dark:text-slate-500'
                  }`}
                >
                  {label}
                </span>
              </span>
            )
          })
        )}
      </nav>

      {/* Portal label - pushed to end */}
      <span className="ml-auto text-[9px] font-black tracking-widest text-slate-300 uppercase dark:text-slate-600">
        {portalLabel.replace(' Portal', '')}
      </span>
    </div>
  )
}
/* ── Nav item with optional tooltip when collapsed ── */
function NavItem({
  href,
  icon: Icon,
  label,
  badge,
  active,
  collapsed,
  basePath,
  setMobileOpen,
}: {
  href: string
  icon?: ElementType
  label: string
  badge?: number
  active: boolean
  collapsed: boolean
  basePath: string
  setMobileOpen: (open: boolean) => void
}) {
  const content = (
    <Link
      href={basePath + href}
      onClick={() => setMobileOpen(false)}
      className={`flex items-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-150 ease-out ${
        collapsed ? 'mx-auto h-10 w-10 justify-center p-0' : 'gap-3'
      } ${
        active
          ? 'border-sidebar-border/40 bg-sidebar-accent font-semibold text-sidebar-foreground shadow-sm'
          : 'border-transparent text-sidebar-foreground/60 hover:border-sidebar-border/30 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:shadow-sm'
      }`}
    >
      {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
      {!collapsed && <span className="flex-1">{label}</span>}
      {!collapsed && badge ? (
        <span className="min-w-[18px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
          {badge}
        </span>
      ) : null}
    </Link>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{content}</TooltipTrigger>
        <TooltipContent side="right" className="flex items-center gap-2">
          {label}
          {badge ? (
            <span className="min-w-[16px] rounded-full bg-red-500 px-1 py-0.5 text-center text-[10px] font-black text-white">
              {badge}
            </span>
          ) : null}
        </TooltipContent>
      </Tooltip>
    )
  }

  return content
}

/* ── Group item with optional tooltip when collapsed ── */
function GroupItem({
  link,
  collapsed,
  openGroups,
  toggleGroup,
  basePath,
  setMobileOpen,
  isActivePath,
  isGroupActive,
}: {
  link: SidebarLinkItem
  collapsed: boolean
  openGroups: string[]
  toggleGroup: (label: string) => void
  basePath: string
  setMobileOpen: (open: boolean) => void
  isActivePath: (href: string) => boolean
  isGroupActive: (link: SidebarLink) => boolean
}) {
  const Icon = link.icon
  const active = isGroupActive(link)
  const isOpen = openGroups.includes(link.label)

  const trigger = (
    <button
      onClick={() => toggleGroup(link.label)}
      className={`flex w-full items-center rounded-xl border px-3 py-2.5 text-sm font-medium transition-all duration-150 ease-out ${
        collapsed ? 'mx-auto h-10 w-10 justify-center p-0' : 'gap-3'
      } ${
        active
          ? 'border-sidebar-border/40 bg-sidebar-accent font-semibold text-sidebar-foreground shadow-sm'
          : 'border-transparent text-sidebar-foreground/60 hover:border-sidebar-border/30 hover:bg-sidebar-accent hover:text-sidebar-foreground hover:shadow-sm'
      }`}
    >
      {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
      {!collapsed && <span className="flex-1 text-left">{link.label}</span>}
      {!collapsed && link.badge ? (
        <span className="min-w-[18px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
          {link.badge}
        </span>
      ) : null}
      {!collapsed && (
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      )}
    </button>
  )

  return (
    <div>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {link.label}
            {link.badge ? (
              <span className="min-w-[16px] rounded-full bg-red-500 px-1 py-0.5 text-center text-[10px] font-black text-white">
                {link.badge}
              </span>
            ) : null}
          </TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      {!collapsed && isOpen && link.children && (
        <div className="border-sidebar-border mt-0.5 ml-7 space-y-0.5 border-l pl-3">
          {link.children.map((child) => (
            <Link
              key={child.href}
              href={basePath + child.href}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-xl px-3 py-2 text-[13px] font-medium transition-all ${
                isActivePath(child.href)
                  ? 'bg-sidebar-accent font-semibold text-sidebar-foreground'
                  : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
              }`}
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── User profile panel ── */
const THEME_OPTIONS = [
  { value: 'light', icon: Sun, label: 'Light' },
  { value: 'dark', icon: Moon, label: 'Dark' },
  { value: 'system', icon: Monitor, label: 'System' },
] as const

function UserMenu({
  collapsed,
  userImage,
  userName,
  userRole,
  portalColor,
  basePath,
  userMenuItems,
  theme,
  setTheme,
}: {
  collapsed: boolean
  userImage?: string
  userName?: string
  userRole?: string
  portalColor: string
  basePath: string
  userMenuItems?: SidebarLinkItem[]
  theme: string | undefined
  setTheme: (t: string) => void
}) {
  const [open, setOpen] = useState(false)

  const initials = userName
    ? userName.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?'

  const avatar = () => (
    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-xl border border-sidebar-border/50 bg-sidebar-accent">
      {userImage ? (
        <Image src={userImage} alt={userName || 'User'} fill className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[11px] font-black uppercase text-sidebar-foreground/50">
          {initials}
        </div>
      )}
    </div>
  )

  const menuLink =
    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-all duration-150 ease-out hover:bg-sidebar-accent hover:text-sidebar-foreground'

  return (
    <div className="relative">
      {/* Click-outside overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.22 }}
            className="absolute bottom-full left-0 right-0 z-50 mb-2 overflow-hidden rounded-2xl border border-white/15 bg-sidebar/95 shadow-2xl backdrop-blur-xl"
          >
            <div className="p-1.5">
              {userMenuItems?.map((item) => {
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={buildHref(basePath, item.href)}
                    onClick={() => setOpen(false)}
                    className={menuLink}
                  >
                    {Icon ? <Icon className="h-4 w-4 text-sidebar-foreground/40" /> : null}
                    {!collapsed && item.label}
                  </Link>
                )
              })}

              {/* Homepage */}
              <Link href="/" onClick={() => setOpen(false)} className={menuLink}>
                <Home className="h-4 w-4 text-sidebar-foreground/40" />
                {!collapsed && 'Homepage'}
              </Link>

              {/* Appearance */}
              {!collapsed && (
                <>
                  <div className="my-1.5 h-px bg-sidebar-border/50" />
                  <div className="px-1 py-1.5">
                    <p className="mb-2 px-2 text-[10px] font-black tracking-widest uppercase text-sidebar-foreground/30">
                      Appearance
                    </p>
                    <div className="flex gap-1 rounded-2xl bg-black/20 p-1.5 ring-1 ring-white/5">
                      {THEME_OPTIONS.map(({ value, icon: Icon, label }) => (
                        <button
                          key={value}
                          onClick={() => setTheme(value)}
                          className={`relative flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-[10px] font-bold transition-all duration-150 ${
                            theme === value
                              ? 'bg-sidebar-accent text-sidebar-foreground shadow-md ring-1 ring-white/10'
                              : 'text-sidebar-foreground/35 hover:text-sidebar-foreground/70'
                          }`}
                        >
                          <Icon className="h-3 w-3" />
                          <span>{label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="my-1.5 h-px bg-sidebar-border/50" />

              {/* Sign out */}
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-all duration-150 hover:bg-red-500/10 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && 'Sign Out'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger */}
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setOpen((v) => !v)}
              className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-sidebar-border/40 bg-sidebar-accent/20 transition-all duration-150 ease-out hover:border-sidebar-border/70 hover:bg-sidebar-accent/50"
            >
              {avatar()}
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">{userName || 'User menu'}</TooltipContent>
        </Tooltip>
      ) : (
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-3 rounded-xl border border-sidebar-border/40 bg-sidebar-accent/20 px-3 py-2.5 text-left transition-all duration-150 ease-out hover:border-sidebar-border/70 hover:bg-sidebar-accent/50"
        >
          {avatar()}
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-sidebar-foreground">
              {userName || 'User'}
            </p>
            {userRole && (
              <p className={`mt-0.5 truncate text-[10px] font-bold tracking-widest uppercase ${portalColor}`}>
                {userRole}
              </p>
            )}
          </div>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-sidebar-foreground/30 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}
    </div>
  )
}


function renderSidebarContent({
  isCollapsed,
  setIsCollapsed,
  links,
  basePath,
  portalLabel,
  portalColor,
  userName,
  userRole,
  userImage,
  userMenuItems,
  openGroups,
  toggleGroup,
  isActivePath,
  isGroupActive,
  setMobileOpen,
  theme,
  setTheme,
  forceFull = false,
}: {
  isCollapsed: boolean
  setIsCollapsed: (c: boolean) => void
  links: SidebarLink[]
  basePath: string
  portalLabel: string
  portalColor: string
  userName?: string
  userRole?: string
  userImage?: string
  userMenuItems?: SidebarLinkItem[]
  openGroups: string[]
  toggleGroup: (label: string) => void
  isActivePath: (href: string) => boolean
  isGroupActive: (link: SidebarLink) => boolean
  setMobileOpen: (open: boolean) => void
  theme: string | undefined
  setTheme: (t: string) => void
  forceFull?: boolean
}) {
  const collapsed = forceFull ? false : isCollapsed

  return (
    <div className="flex h-full flex-col">
      {/* Logo & Collapse Toggle */}
      <div
        className={`border-sidebar-border relative flex flex-col border-b px-5 py-5 ${
          collapsed ? 'items-center' : ''
        }`}
      >
        <div className="flex items-center justify-between">
          <Link
            href={basePath || '/'}
            className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}
          >
            {collapsed ? (
              <Image
                src="/apple-touch-icon.webp"
                alt="Aerojet Academy"
                width={32}
                height={32}
                className="h-auto w-auto object-contain"
                style={{ width: 'auto', height: 'auto' }}
              />
            ) : (
              <Image
                src="/images/logos/ATA_logo_hor_onDark.webp"
                alt="Aerojet Academy"
                width={130}
                height={32}
                className="h-auto w-auto object-contain"
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
            )}
          </Link>

          {!collapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/40 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="mt-4 hidden h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/40 transition-all hover:bg-sidebar-accent hover:text-sidebar-foreground lg:flex"
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" aria-hidden="true" />
          </button>
        )}

        {!collapsed && (
          <span
            className={`mt-2 block text-[10px] font-black tracking-[0.2em] uppercase ${portalColor}`}
          >
            {portalLabel}
          </span>
        )}
      </div>

      {/* Nav Links */}
      <nav
        id="sidebar-nav"
        className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.08) transparent',
        }}
      >
        {links.map((link, idx) => {
          if (link.type === 'header') {
            return (
              <div
                key={link.label || idx}
                className={`px-3 pt-5 pb-2 text-[10px] font-black tracking-widest text-muted-foreground/50 uppercase transition-all ${
                  collapsed ? 'text-center' : ''
                }`}
              >
                {collapsed ? '---' : link.label}
              </div>
            )
          }

          if (link.children) {
            return (
              <GroupItem
                key={link.label}
                link={link}
                collapsed={collapsed}
                openGroups={openGroups}
                toggleGroup={toggleGroup}
                basePath={basePath}
                setMobileOpen={setMobileOpen}
                isActivePath={isActivePath}
                isGroupActive={isGroupActive}
              />
            )
          }

          return (
            <NavItem
              key={link.href}
              href={link.href}
              icon={link.icon}
              label={link.label}
              badge={link.badge}
              active={!!isActivePath(link.href)}
              collapsed={collapsed}
              basePath={basePath}
              setMobileOpen={setMobileOpen}
            />
          )
        })}
      </nav>

      {/* Footer — User Dropdown Menu */}
      <div id="sidebar-user-menu" className="border-sidebar-border border-t px-3 py-4">
        <UserMenu
          collapsed={collapsed}
          userImage={userImage}
          userName={userName}
          userRole={userRole}
          portalColor={portalColor}
          basePath={basePath}
          userMenuItems={userMenuItems}
          theme={theme}
          setTheme={setTheme}
        />
      </div>
    </div>
  )
}

export default function DashboardSidebar({
  links,
  portalLabel,
  portalColor = 'text-blue-400',
  userName,
  userRole,
  userImage,
  basePath = '',
  userMenuItems,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    links.forEach((link) => {
      if (link.children) {
        const isActive = link.children.some((child) => pathname.startsWith(basePath + child.href))
        if (isActive) {
          setOpenGroups((prev) => (prev.includes(link.label) ? prev : [...prev, link.label]))
        }
      }
    })
  }, [pathname, links, basePath])

  const toggleGroup = (label: string) => {
    if (isCollapsed) setIsCollapsed(false)
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  const isActivePath = (href: string) => pathname === basePath + href
  const isGroupActive = (link: SidebarLink): boolean => {
    if (link.type === 'header') return false
    return (
      pathname.startsWith(basePath + (link.href ?? '')) ||
      (link.children?.some((c) => pathname.startsWith(basePath + c.href)) ?? false)
    )
  }



  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`bg-sidebar border-sidebar-border sticky top-0 hidden h-screen shrink-0 flex-col border-r transition-all duration-300 lg:flex ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {renderSidebarContent({
          isCollapsed,
          setIsCollapsed,
          links,
          basePath,
          portalLabel,
          portalColor,
          userName,
          userRole,
          userImage,
          userMenuItems,
          openGroups,
          toggleGroup,
          isActivePath,
          isGroupActive,
          setMobileOpen,
          theme,
          setTheme,
        })}
      </aside>

      {/* Mobile Top Bar */}
      <MobileTopBar portalLabel={portalLabel} onOpenMenu={() => setMobileOpen(true)} />

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-60 bg-black/60 lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-sidebar border-sidebar-border fixed inset-y-0 left-0 z-70 flex w-72 flex-col border-r shadow-2xl lg:hidden"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="text-sidebar-foreground/60 absolute top-5 right-5 z-80 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 transition-all hover:bg-white/10 hover:text-white"
                title="Close sidebar"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="flex-1 overflow-y-auto">
                {renderSidebarContent({
                  isCollapsed,
                  setIsCollapsed,
                  links,
                  basePath,
                  portalLabel,
                  portalColor,
                  userName,
                  userRole,
                  userImage,
                  userMenuItems,
                  openGroups,
                  toggleGroup,
                  isActivePath,
                  isGroupActive,
                  setMobileOpen,
                  theme,
                  setTheme,
                  forceFull: true,
                })}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
