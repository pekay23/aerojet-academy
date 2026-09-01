import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
}
