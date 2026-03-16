'use client'

import { usePathname } from 'next/navigation'
import WelcomeBanner from '@/components/WelcomeBanner'

const PAGE_HEADERS: Record<string, { title: string; description?: string }> = {
  '/student/courses': { title: 'My Courses', description: 'View and manage your enrolled courses' },
  '/student/wallet': { title: 'Wallet', description: 'Manage your balance and transactions' },
  '/student/exams': { title: 'Examinations', description: 'View upcoming and past exams' },
  '/student/classes': { title: 'Classes', description: 'View your class schedule' },
  '/student/materials': { title: 'Study Materials', description: 'Access your learning resources' },
  '/student/notifications': { title: 'Notifications', description: 'View all your notifications' },
  '/student/messages': { title: 'Messages', description: 'View and send messages' },
  '/student/profile': { title: 'My Profile', description: 'Manage your account settings' },
  '/student/certificates': { title: 'Certificates', description: 'View your earned certificates' },
  '/student/results': { title: 'Results', description: 'View your exam results and grades' },
}

function getHeaderForPath(pathname: string): { title: string; description?: string } | null {
  if (PAGE_HEADERS[pathname]) return PAGE_HEADERS[pathname]
  // Try parent path fallback
  const parentPath = pathname.replace(/\/[^/]+$/, '')
  if (PAGE_HEADERS[parentPath]) return PAGE_HEADERS[parentPath]
  return null
}

export default function DynamicPageHeader({
  userName,
  welcomeMessages,
}: {
  userName: string
  welcomeMessages: string[]
}) {
  const pathname = usePathname()
  const isDashboard = pathname === '/student'

  if (isDashboard) {
    return <WelcomeBanner messages={welcomeMessages} userName={userName} />
  }

  const header = getHeaderForPath(pathname)
  if (!header) return null

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground sm:text-2xl">{header.title}</h1>
      {header.description && (
        <p className="mt-1 text-sm text-muted-foreground">{header.description}</p>
      )}
    </div>
  )
}
