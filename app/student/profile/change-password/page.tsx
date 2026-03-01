import ChangePasswordForm from '@/components/shared/ChangePasswordForm'

export const metadata: Metadata = { title: 'Change Password' }

export default function Page() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-slate-100">
          Change Password
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Update your account security.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-sm sm:p-10 dark:border-slate-800 dark:bg-slate-900">
        <ChangePasswordForm apiEndpoint="/api/student/profile/change-password" />
      </div>

      <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
        <p className="text-xs text-blue-700 dark:text-blue-300">
          <strong>Tip:</strong> Use a combination of letters, numbers, and symbols to create a
          strong password. Avoid using common words or personal information.
        </p>
      </div>
    </div>
  )
}
