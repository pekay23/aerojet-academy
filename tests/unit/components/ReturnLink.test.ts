import { describe, it, expect } from 'vitest'
import { appendReturnNavigation } from '@/components/shared/ReturnLink'

describe('appendReturnNavigation', () => {
  it('appends returnUrl and returnType to a plain href', () => {
    const result = appendReturnNavigation('/staff/notifications', '/staff/exams', 'notification')
    const params = new URLSearchParams(result.split('?')[1])
    expect(params.get('returnUrl')).toBe('/staff/exams')
    expect(params.get('returnType')).toBe('notification')
  })

  it('merges returnUrl/returnType without duplicates when href has existing query params', () => {
    const result = appendReturnNavigation(
      '/staff/notifications?tab=settings&foo=bar',
      '/staff/exams',
      'notification'
    )
    const params = new URLSearchParams(result.split('?')[1])
    expect(params.get('returnUrl')).toBe('/staff/exams')
    expect(params.get('returnType')).toBe('notification')
    expect(params.get('tab')).toBe('settings')
    expect(params.get('foo')).toBe('bar')
    // No duplicate keys
    const keys = params.getAll('returnUrl')
    expect(keys.length).toBe(1)
  })

  it('removes stale returnUrl from href before setting new one', () => {
    const result = appendReturnNavigation(
      '/staff/notifications?returnUrl=/old/path&returnType=old',
      '/staff/exams',
      'notification'
    )
    const params = new URLSearchParams(result.split('?')[1])
    expect(params.get('returnUrl')).toBe('/staff/exams')
    expect(params.get('returnType')).toBe('notification')
    expect(params.get('old')).toBeNull()
  })

  it('replaces returnUrl when href already has it', () => {
    const result = appendReturnNavigation(
      '/staff/notifications?returnUrl=/first&returnType=info',
      '/staff/second',
      'alert'
    )
    const params = new URLSearchParams(result.split('?')[1])
    expect(params.get('returnUrl')).toBe('/staff/second')
    expect(params.get('returnType')).toBe('alert')
  })

  it('handles href without query string', () => {
    const result = appendReturnNavigation('/staff/notifications', '/staff/exams')
    expect(result).toBe('/staff/notifications?returnUrl=%2Fstaff%2Fexams&returnType=notification')
  })

  it('handles returnUrl containing query characters', () => {
    const result = appendReturnNavigation(
      '/staff/notifications',
      '/staff/exams?tab=records&filter=all',
      'notification'
    )
    const params = new URLSearchParams(result.split('?')[1])
    expect(params.get('returnUrl')).toBe('/staff/exams?tab=records&filter=all')
    expect(params.get('returnType')).toBe('notification')
  })

  it('omits returnType param when not provided', () => {
    const result = appendReturnNavigation('/path', '/target', '')
    const params = new URLSearchParams(result.split('?')[1])
    expect(params.get('returnUrl')).toBe('/target')
    expect(params.has('returnType')).toBe(false)
  })

  it('preserves multiple existing unrelated params', () => {
    const result = appendReturnNavigation(
      '/staff/notifications?tab=results&sort=desc&page=2',
      '/staff/exams',
      'notification'
    )
    const params = new URLSearchParams(result.split('?')[1])
    expect(params.get('tab')).toBe('results')
    expect(params.get('sort')).toBe('desc')
    expect(params.get('page')).toBe('2')
    expect(params.get('returnUrl')).toBe('/staff/exams')
  })
})
