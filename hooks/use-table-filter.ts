'use client'
import { useState, useCallback, useMemo } from 'react'

export function useTableFilter<T extends Record<string, any>>(data: T[], searchKeys: (keyof T)[]) {
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<Record<string, any>>({})

  const filtered = useMemo(() => {
    let result = data

    if (search) {
      const q = search.toLowerCase()
      result = result.filter((row) => searchKeys.some((key) => String(row[key] ?? '').toLowerCase().includes(q)))
    }

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        result = result.filter((row) => row[key] === value)
      }
    })

    return result
  }, [data, search, filters, searchKeys])

  const setFilter = useCallback((key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }, [])

  const clearFilters = useCallback(() => { setSearch(''); setFilters({}) }, [])

  return { filtered, search, setSearch, filters, setFilter, clearFilters }
}
