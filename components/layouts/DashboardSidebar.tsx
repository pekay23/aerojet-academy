'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
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
  User,
} from 'lucide-react'
import { ElementType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
      className={`flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        collapsed ? 'mx-auto h-10 w-10 justify-center p-0' : 'gap-3'
      } ${
        active
          ? 'bg-sidebar-accent font-semibold text-sidebar-foreground'
          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
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
      className={`flex w-full items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
        collapsed ? 'mx-auto h-10 w-10 justify-center p-0' : 'gap-3'
      } ${
        active
          ? 'bg-sidebar-accent font-semibold text-sidebar-foreground'
          : 'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground'
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

/* ── User dropdown menu ── */
function UserMenu({
  collapsed,
  userImage,
  userName,
  userRole,
  portalColor,
  userMenuItems,
  basePath,
  toggleTheme,
  renderThemeIcon,
  renderThemeLabel,
}: {
  collapsed: boolean
  userImage?: string
  userName?: string
  userRole?: string
  portalColor: string
  userMenuItems?: SidebarLinkItem[]
  basePath: string
  toggleTheme: () => void
  renderThemeIcon: () => React.ReactNode
  renderThemeLabel: () => string
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const trigger = (
    <DropdownMenuTrigger asChild>
      <button
        className={`flex w-full items-center gap-3 rounded-xl border border-sidebar-border/50 bg-sidebar-accent/30 px-3 py-2.5 text-left transition-all hover:bg-sidebar-accent ${
          collapsed ? 'justify-center px-0' : ''
        }`}
      >
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-sidebar-border bg-sidebar-accent">
          {userImage ? (
            <Image src={userImage} alt={userName || 'User'} fill className="object-cover" />
          ) : (
            <div className="text-sidebar-foreground/50 flex h-full w-full items-center justify-center text-[10px] font-black uppercase">
              {userName ? userName.substring(0, 2) : <User className="h-3.5 w-3.5" />}
            </div>
          )}
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="text-sidebar-foreground truncate text-xs font-bold">
                {userName || 'User'}
              </p>
              {userRole && (
                <p
                  className={`mt-0.5 truncate text-[10px] font-bold tracking-widest uppercase ${portalColor}`}
                >
                  {userRole}
                </p>
              )}
            </div>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/40" />
          </>
        )}
      </button>
    </DropdownMenuTrigger>
  )

  return (
    <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent side="right">{userName || 'User menu'}</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <DropdownMenuContent side="top" align="start" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userMenuItems?.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={basePath + item.href} className="flex items-center gap-2">
              {item.icon && <item.icon className="h-4 w-4" />}
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={(e) => {
            e.preventDefault()
          }}
          onClick={() => {
            toggleTheme()
            setMenuOpen(true)
          }}
          className="flex items-center gap-2"
        >
          {renderThemeIcon()}
          Theme: {renderThemeLabel()}
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Homepage
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
  toggleTheme,
  renderThemeIcon,
  renderThemeLabel,
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
  toggleTheme: () => void
  renderThemeIcon: () => React.ReactNode
  renderThemeLabel: () => string
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
                className="object-contain"
              />
            ) : (
              <Image
                src="/images/logos/ATA_logo_hor_onDark.webp"
                alt="Aerojet Academy"
                width={130}
                height={32}
                className="object-contain"
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
      <div className="border-sidebar-border border-t px-3 py-4">
        <UserMenu
          collapsed={collapsed}
          userImage={userImage}
          userName={userName}
          userRole={userRole}
          portalColor={portalColor}
          userMenuItems={userMenuItems}
          basePath={basePath}
          toggleTheme={toggleTheme}
          renderThemeIcon={renderThemeIcon}
          renderThemeLabel={renderThemeLabel}
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

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark')
    else if (theme === 'dark') setTheme('system')
    else setTheme('light')
  }

  const renderThemeIcon = () => {
    if (!mounted) return <Sun className="h-4 w-4 shrink-0" />
    if (theme === 'dark') return <Moon className="h-4 w-4 shrink-0" />
    if (theme === 'system') return <Monitor className="h-4 w-4 shrink-0" />
    return <Sun className="h-4 w-4 shrink-0" />
  }

  const renderThemeLabel = () => {
    if (!mounted) return 'Light'
    if (theme === 'dark') return 'Dark'
    if (theme === 'system') return 'System'
    return 'Light'
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
          toggleTheme,
          renderThemeIcon,
          renderThemeLabel,
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
                  toggleTheme,
                  renderThemeIcon,
                  renderThemeLabel,
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
