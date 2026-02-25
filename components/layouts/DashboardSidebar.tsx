'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { ChevronDown, ChevronsLeft, ChevronsRight, LogOut, Menu, X } from 'lucide-react'
import { ElementType } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ThemeToggle from '@/components/shared/ThemeToggle'

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
}

export default function DashboardSidebar({
  links,
  portalLabel,
  portalColor = 'text-blue-400',
  userName,
  userRole,
  userImage,
  basePath = '',
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const [openGroups, setOpenGroups] = useState<string[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

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
    if (isCollapsed) setIsCollapsed(false) // Auto-expand if clicking a group while collapsed
    setOpenGroups((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    )
  }

  const isActive = (href: string) => pathname === basePath + href
  const isGroupActive = (link: SidebarLink) => {
    if (link.type === 'header') return false
    return (
      pathname.startsWith(basePath + link.href) ||
      link.children?.some((c) => pathname.startsWith(basePath + c.href))
    )
  }

  const SidebarContent = ({ forceFull = false }: { forceFull?: boolean }) => {
    const collapsed = forceFull ? false : isCollapsed

    return (
      <div className="flex h-full flex-col">
        {/* Logo & Collapse Toggle */}
        <div
          className={`relative flex flex-col border-b border-slate-800 px-5 py-5 ${
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
                className="hidden items-center justify-center rounded-lg p-1.5 text-slate-400 transition-all hover:bg-white/5 hover:text-white lg:flex"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <ChevronsLeft className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {collapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="mt-4 hidden items-center justify-center rounded-lg p-1.5 text-slate-400 transition-all hover:bg-white/5 hover:text-white lg:flex"
              title="Expand sidebar"
              aria-label="Expand sidebar"
            >
              <ChevronsRight className="h-4 w-4" aria-hidden="true" />
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

        {/* Nav Links — subtle scrollbar */}
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
                  className={`px-3 pt-5 pb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase transition-all dark:text-slate-500 ${
                    collapsed ? 'text-center text-[10px]' : ''
                  }`}
                >
                  {collapsed ? '•••' : link.label}
                </div>
              )
            }

            const Icon = link.icon
            const active = isGroupActive(link)
            const isOpen = openGroups.includes(link.label)

            if (link.children) {
              return (
                <div key={link.label}>
                  <button
                    onClick={() => toggleGroup(link.label)}
                    className={`flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${collapsed ? 'justify-center' : 'gap-3'} ${active ? 'bg-white/10 text-white dark:bg-blue-600/20 dark:text-blue-400' : 'text-slate-400 hover:bg-white/5 hover:text-white dark:hover:bg-slate-800'}`}
                    title={collapsed ? link.label : undefined}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0" />}
                    {!collapsed && <span className="flex-1 text-left">{link.label}</span>}
                    {!collapsed && link.badge ? (
                      <span className="min-w-[18px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                        {link.badge}
                      </span>
                    ) : collapsed && link.badge ? (
                      <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
                    ) : null}
                    {!collapsed && (
                      <ChevronDown
                        className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      />
                    )}
                  </button>
                  {!collapsed && isOpen && (
                    <div className="mt-0.5 ml-7 space-y-0.5 border-l border-slate-700 pl-3">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={basePath + child.href}
                          onClick={() => setMobileOpen(false)}
                          className={`block rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                            isActive(child.href)
                              ? 'bg-white/10 text-white dark:bg-blue-600/20 dark:text-blue-400'
                              : 'text-slate-500 hover:bg-white/5 hover:text-white dark:hover:bg-slate-800'
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

            return (
              <div key={link.href} className="relative">
                <Link
                  href={basePath + link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${collapsed ? 'justify-center' : 'gap-3'} ${
                    isActive(link.href)
                      ? 'bg-white/10 text-white dark:bg-blue-600/20 dark:text-blue-400'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white dark:hover:bg-slate-800'
                  }`}
                  title={collapsed ? link.label : undefined}
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  {!collapsed && <span className="flex-1">{link.label}</span>}
                  {!collapsed && link.badge ? (
                    <span className="min-w-[18px] rounded-full bg-red-500 px-1.5 py-0.5 text-center text-[10px] font-black text-white">
                      {link.badge}
                    </span>
                  ) : collapsed && link.badge ? (
                    <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500" />
                  ) : null}
                </Link>
              </div>
            )
          })}
        </nav>

        {/* Footer Area */}
        <div className="flex flex-col border-t border-slate-800 px-3 py-4">
          {/* User Info & Profile Picture */}
          {(userName || userImage) && (
            <div
              className={`mb-4 flex items-center gap-3 px-1 ${collapsed ? 'justify-center' : ''}`}
            >
              <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
                {userImage ? (
                  <Image src={userImage} alt={userName || 'User'} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                    {userName ? userName.substring(0, 2) : '??'}
                  </div>
                )}
              </div>

              {!collapsed && userName && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-white dark:text-slate-100">
                    {userName}
                  </p>
                  {userRole && (
                    <p
                      className={`mt-0.5 truncate text-[10px] font-bold tracking-widest uppercase ${portalColor}`}
                    >
                      {userRole}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions - Theme Toggle and Sign Out */}
          <div className="flex flex-col gap-1.5">
            <ThemeToggle isCollapsed={collapsed} />

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className={`flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-slate-400 transition-all hover:bg-white/5 hover:text-white ${
                collapsed ? 'justify-center' : ''
              }`}
              title={collapsed ? 'Sign Out' : undefined}
            >
              <LogOut className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="flex-1 text-left">Sign Out</span>}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop Sidebar (Sticky Flex Layout) */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col bg-[#0f1629] transition-all duration-300 lg:flex dark:border-r dark:border-slate-800 dark:bg-slate-900 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Mobile Toggle */}
      <div className="fixed top-4 left-4 z-40 lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f1629] text-white shadow-xl transition-transform hover:scale-105 active:scale-95 dark:bg-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

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
              className="fixed inset-y-0 left-0 z-70 flex w-72 flex-col bg-[#0f1629] shadow-2xl lg:hidden dark:border-r dark:border-slate-800 dark:bg-slate-900"
            >
              <button
                onClick={() => setMobileOpen(false)}
                className="absolute top-5 right-5 z-80 flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                title="Close sidebar"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent forceFull={true} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
