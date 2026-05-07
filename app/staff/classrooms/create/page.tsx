import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import { redirect } from 'next/navigation'
import CreateClassroomForm from './CreateClassroomForm'

export const metadata: Metadata = {
  title: 'Add Classroom | Staff Portal',
  description: 'Add a new classroom or lab.',
}

export default async function CreateClassroomPage() {
  const session = await getAuthSession()
  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) redirect('/login')

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">Add Room</h1>
        <p className="text-slate-500 dark:text-slate-400">Configure a new physical space for classes.</p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <CreateClassroomForm />
      </div>
    </div>
  )
}
