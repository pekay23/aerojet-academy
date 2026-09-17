export interface ActionErrorContext {
  action: string
  userId?: string
  [key: string]: unknown
}

export interface StructuredError {
  timestamp: string
  action: string
  userId?: string
  message: string
  stack?: string
  context?: ActionErrorContext
}

export function createStructuredError(
  context: ActionErrorContext,
  error: unknown
): StructuredError {
  const message = error instanceof Error ? error.message : 'Unknown error'
  const stack = error instanceof Error ? error.stack : undefined

  return {
    timestamp: new Date().toISOString(),
    action: context.action,
    userId: context.userId,
    message,
    stack,
    context,
  }
}

export function logActionError(context: ActionErrorContext, error: unknown): void {
  const structured = createStructuredError(context, error)

  console.error(
    JSON.stringify({
      level: 'error',
      ...structured,
    })
  )
}
