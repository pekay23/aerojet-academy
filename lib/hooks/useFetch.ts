'use client'

import { useCallback, useEffect, useState } from 'react'

export interface FetchState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Reusable client-side data fetching hook.
 *
 * Reduces the duplicated `useState` + `useEffect` fetch pattern used across
 * applicant portal client components. The hook unwraps `{ data }` envelopes
 * automatically and exposes a `refetch()` for re-fetching after mutations.
 */
export function useFetch<T = unknown>(url: string) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  })

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const res = await fetch(url)
      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`)
      }
      const json = await res.json()
      setState({ data: (json?.data ?? json) as T, loading: false, error: null })
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch data',
      })
    }
  }, [url])

  useEffect(() => {
    void load()
  }, [load])

  return { ...state, refetch: load }
}
