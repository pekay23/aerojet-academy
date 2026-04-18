import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma/client'
import InstructorSidebar from './_components/InstructorSidebar'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'
import PortalHeader from '@/components/layouts/PortalHeader'
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

  const userName = user.name || user.email || ''
  const userRole = user.role
  const pendingCount = await getPendingGradingCount()

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <InstructorSidebar
        userName={userName}
        userRole={userRole}
        userImage={user.image ?? undefined}
        pendingCount={pendingCount}
      />
      <main id="main-content" className="relative pt-16 lg:pt-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="sticky top-0 z-30 border-b border-slate-100 bg-slate-50/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-900/80">
          <div className="mx-auto max-w-[1920px] px-4 py-3 sm:px-8 lg:px-8">
            <PortalHeader>
              <BreadcrumbNav />
            </PortalHeader>
          </div>
        </div>
        <div className="mx-auto max-w-[1920px] p-4 sm:p-8 lg:px-8 lg:py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
