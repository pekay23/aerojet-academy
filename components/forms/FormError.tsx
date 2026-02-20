import { AlertCircle } from 'lucide-react'

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  )
}
