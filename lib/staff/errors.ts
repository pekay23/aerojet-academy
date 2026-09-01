import { logActionError } from '@/lib/student/error-handler'

export function handleActionError(
  context: string,
  error: unknown,
  fallbackMessage = 'An unexpected error occurred. Please try again.'
): string {
  logActionError({ action: context }, error)
  return fallbackMessage
}
