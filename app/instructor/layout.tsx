import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import InstructorSidebar from './_components/InstructorSidebar'
import BreadcrumbNav from '@/components/layouts/BreadcrumbNav'
import { getPendingGradingCount } from '@/lib/actions/instructor'

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const user = session.user
  if (!['INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) redirect('/login')

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
      <main className="flex min-h-screen flex-1 flex-col">
        <div className="p-6 sm:p-8 lg:p-10">
          <BreadcrumbNav />
          {children}
        </div>
      </main>
    </div>
  )
}
