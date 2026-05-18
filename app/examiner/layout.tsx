import { requireExaminer } from '@/lib/auth/helpers'
import ExaminerSidebar from './_components/ExaminerSidebar'
import { Toaster } from 'sonner'

export const dynamic = 'force-dynamic'

export default async function ExaminerLayout({ children }: { children: React.ReactNode }) {
  // Enforce security at the layout level
  await requireExaminer().catch((err) => {
    // If not an examiner, this will trigger the redirect or error
    throw err
  })

  return (
    <div className="flex min-h-screen bg-slate-50/50 dark:bg-slate-950">
      <ExaminerSidebar />
      <main id="main-content" className="flex-1 overflow-y-auto px-8 py-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
      <Toaster position="top-right" richColors />
    </div>
  )
}
