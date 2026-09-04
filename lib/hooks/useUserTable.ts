'use client'

import { useCallback, useEffect, useState } from 'react'

export interface UseUserTableOptions<_T> {
  endpoint: string
  queryParams?: Record<string, string | undefined>
  initialPageSize?: number
  debounceMs?: number
}

export interface UseUserTableResult<T> {
  data: T[]
  total: number
  loading: boolean
  error: string | null
  search: string
  setSearch: (value: string) => void
  page: number
  setPage: (value: number) => void
  perPage: number
  setPerPage: (value: number) => void
  selectedIds: string[]
  setSelectedIds: (ids: string[]) => void
  refetch: () => Promise<void>
}

interface ApiEnvelope<T> {
  success?: boolean
  data?: T
  meta?: { total?: number }
}

export function useUserTable<T = Record<string, unknown>>(
  options: UseUserTableOptions<T>
): UseUserTableResult<T> {
  const { endpoint, queryParams = {}, initialPageSize = 25, debounceMs = 350 } = options

  const [data, setData] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(initialPageSize)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        ...queryParams,
        search,
        page: page.toString(),
        limit: perPage.toString(),
      } as Record<string, string>)

      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined) params.set(key, value)
      })

      const res = await fetch(`${endpoint}?${params.toString()}`)
      const json = (await res.json()) as ApiEnvelope<T[]>

      if (!res.ok || json.success === false) {
        throw new Error(`Request failed with status ${res.status}`)
      }

      setData(Array.isArray(json.data) ? json.data : [])
      setTotal(json.meta?.total ?? 0)
      setSelectedIds([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      setData([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }, [endpoint, search, page, perPage, queryParams])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPage(1)
  }, [search])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData()
    }, search ? debounceMs : 0)
    return () => clearTimeout(timer)
  }, [fetchData, search, debounceMs])

  return {
    data,
    total,
    loading,
    error,
    search,
    setSearch,
    page,
    setPage,
    perPage,
    setPerPage,
    selectedIds,
    setSelectedIds,
    refetch: fetchData,
  }
}
