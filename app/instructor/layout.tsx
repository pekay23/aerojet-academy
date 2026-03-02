import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import InstructorSidebar from './_components/InstructorSidebar'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'
import { getPendingGradingCount } from '@/lib/actions/instructor'

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const user = session.user
  const allowedRoles = ['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN']
  if (!allowedRoles.includes(user.role)) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { status: true, role: true },
  })

  if (
    !dbUser ||
    ['SUSPENDED', 'DELETED', 'ARCHIVED'].includes(dbUser.status) ||
    !allowedRoles.includes(dbUser.role)
  ) {
    redirect('/login')
  }

  const userName = user.name || user.email
  const userRole = user.role
  const pendingCount = await getPendingGradingCount()

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-900">
      <InstructorSidebar
        userName={userName}
        userRole={userRole}
        userImage={user.image || undefined}
        pendingCount={pendingCount}
      />
      <main id="main-content" className="flex min-h-screen flex-1 flex-col">
        <div className="p-4 pt-16 sm:p-8 lg:p-10 lg:pt-10">
          <BreadcrumbNav />
          {children}
        </div>
      </main>
    </div>
  )
}
