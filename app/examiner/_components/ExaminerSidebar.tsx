'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  ShieldCheck, 
  LayoutDashboard, 
  Calendar, 
  FileCheck, 
  UserCircle,
  LogOut,
  ChevronLeft
} from 'lucide-react'
import { motion } from 'framer-motion'

const MENU_ITEMS = [
  { href: '/examiner', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/examiner/schedule', label: 'Schedule', icon: Calendar },
  { href: '/examiner/compliance', label: 'Compliance', icon: FileCheck },
]

export default function ExaminerSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Brand Header */}
      <div className="flex h-20 items-center gap-3 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aerojet-blue shadow-lg shadow-aerojet-blue/20">
          <ShieldCheck className="h-6 w-6 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-black uppercase tracking-tighter text-aerojet-blue">Aerojet</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Examiner Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6">
        {MENU_ITEMS.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
                isActive 
                  ? 'text-aerojet-blue' 
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 bg-aerojet-blue/5 dark:bg-aerojet-blue/10"
                  style={{ borderRadius: '12px' }}
                />
              )}
              <Icon className={`relative z-10 h-5 w-5 ${isActive ? 'text-aerojet-blue' : ''}`} />
              <span className="relative z-10">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="sidebar-dot"
                  className="absolute right-3 h-1.5 w-1.5 rounded-full bg-aerojet-blue shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer / Profile */}
      <div className="border-t border-slate-100 p-4 dark:border-slate-800">
        <Link 
          href="/logout"
          className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-950/20"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  )
}
