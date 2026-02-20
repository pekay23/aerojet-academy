'use client'
import { useState, useCallback } from 'react'

type SortDirection = 'asc' | 'desc'

export function useTableSort<T>(defaultKey?: keyof T, defaultDir: SortDirection = 'asc') {
  const [sortKey, setSortKey] = useState<keyof T | undefined>(defaultKey)
  const [sortDir, setSortDir] = useState<SortDirection>(defaultDir)

  const toggleSort = useCallback((key: keyof T) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }, [sortKey])

  const sortData = useCallback((data: T[]): T[] => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const aVal = a[sortKey], bVal = b[sortKey]
      if (aVal == null) return 1
      if (bVal == null) return -1
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [sortKey, sortDir])

  return { sortKey, sortDir, toggleSort, sortData }
}
