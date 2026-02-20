import { CheckCircle2 } from 'lucide-react'

export function FormSuccess({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-700">
      <CheckCircle2 className="h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  )
}
