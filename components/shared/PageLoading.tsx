import { LoadingSpinner } from './LoadingSpinner'

export function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex min-h-100 flex-col items-center justify-center gap-3">
      <LoadingSpinner size="lg" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  )
}
