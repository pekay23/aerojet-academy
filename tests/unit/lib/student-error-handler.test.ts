import { describe, it, expect, vi } from 'vitest'
import { createStructuredError, logActionError, type ActionErrorContext } from '@/lib/student/error-handler'

describe('createStructuredError', () => {
  it('creates structured error from Error instance', () => {
    const error = new Error('Something went wrong')
    error.stack = 'Error: Something went wrong\n    at test.ts:1:1'

    const context: ActionErrorContext = { action: 'enrollInCourse', userId: 'user-123' }
    const result = createStructuredError(context, error)

    expect(result.timestamp).toBeDefined()
    expect(result.action).toBe('enrollInCourse')
    expect(result.userId).toBe('user-123')
    expect(result.message).toBe('Something went wrong')
    expect(result.stack).toBe('Error: Something went wrong\n    at test.ts:1:1')
  })

  it('creates structured error from non-Error value', () => {
    const context: ActionErrorContext = { action: 'test' }
    const result = createStructuredError(context, 'string error')

    expect(result.message).toBe('Unknown error')
    expect(result.stack).toBeUndefined()
    expect(result.action).toBe('test')
  })

  it('creates structured error from null', () => {
    const context: ActionErrorContext = { action: 'test' }
    const result = createStructuredError(context, null)

    expect(result.message).toBe('Unknown error')
    expect(result.stack).toBeUndefined()
  })

  it('includes ISO timestamp', () => {
    const result = createStructuredError({ action: 'test' }, new Error('x'))
    expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})

describe('logActionError', () => {
  it('logs structured JSON to console.error', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const context: ActionErrorContext = { action: 'enrollInCourse', userId: 'user-123' }
    logActionError(context, new Error('test error'))

    expect(consoleSpy).toHaveBeenCalledTimes(1)
    const call = consoleSpy.mock.calls[0][0]
    expect(typeof call).toBe('string')

    const parsed = JSON.parse(call)
    expect(parsed.level).toBe('error')
    expect(parsed.action).toBe('enrollInCourse')
    expect(parsed.userId).toBe('user-123')
    expect(parsed.message).toBe('test error')

    consoleSpy.mockRestore()
  })
})
