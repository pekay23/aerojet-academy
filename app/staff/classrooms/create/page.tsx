import { redirectToLogin } from '@/lib/auth/redirect-to-login'
import { Metadata } from 'next'
import { getAuthSession } from '@/lib/auth/helpers'
import CreateClassroomForm from './CreateClassroomForm'

export const metadata: Metadata = {
  title: 'Add Classroom | Staff Portal',
  description: 'Add a new classroom or lab.',
}

export default async function CreateClassroomPage() {
  const session = await getAuthSession()
  if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role))
    return await redirectToLogin()

  return (
    <div className="mx-auto max-w-350">
      <div className="mb-8">
        <h1 className="text-aerojet-blue text-3xl font-black tracking-tight dark:text-white">
          Add Room
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Configure a new physical space for classes.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <CreateClassroomForm />
      </div>
    </div>
  )
}
