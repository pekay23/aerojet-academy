import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges'

describe('useUnsavedChanges', () => {
  it('initializes as clean', () => {
    const { result } = renderHook(() => useUnsavedChanges())
    expect(result.current.isDirty).toBe(false)
    expect(result.current.pendingTab).toBeNull()
  })

  it('marks dirty on change', () => {
    const { result } = renderHook(() => useUnsavedChanges())
    act(() => result.current.markDirty())
    expect(result.current.isDirty).toBe(true)
  })

  it('marks clean after save', () => {
    const { result } = renderHook(() => useUnsavedChanges())
    act(() => result.current.markDirty())
    expect(result.current.isDirty).toBe(true)
    act(() => result.current.markClean())
    expect(result.current.isDirty).toBe(false)
  })

  it('allows leave when clean', async () => {
    const { result } = renderHook(() => useUnsavedChanges())
    const allowed = await act(async () => result.current.confirmLeave('tab-2'))
    expect(allowed).toBe(true)
  })

  it('blocks leave when dirty and user cancels', async () => {
    const { result } = renderHook(() => useUnsavedChanges())
    act(() => result.current.markDirty())
    const promise = result.current.confirmLeave('tab-2')
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.pendingTab).toBe('tab-2')
    act(() => result.current.cancelLeave())
    const allowed = await promise
    expect(allowed).toBe(false)
    expect(result.current.pendingTab).toBeNull()
  })

  it('allows leave when dirty and user confirms', async () => {
    const { result } = renderHook(() => useUnsavedChanges())
    act(() => result.current.markDirty())
    const promise = result.current.confirmLeave('tab-2')
    act(() => result.current.proceedLeave())
    const allowed = await promise
    expect(allowed).toBe(true)
    expect(result.current.isDirty).toBe(false)
  })
})
