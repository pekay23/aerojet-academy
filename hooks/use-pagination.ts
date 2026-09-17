'use client'
import { useState } from 'react'

interface UsePaginationOptions { initialPage?: number; pageSize?: number; total?: number }

export function usePagination({ initialPage = 1, pageSize = 10, total = 0 }: UsePaginationOptions = {}) {
  const [page, setPage] = useState(initialPage)
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const goTo = (p: number) => setPage(Math.min(Math.max(1, p), totalPages))
  const next = () => goTo(page + 1)
  const prev = () => goTo(page - 1)

  return { page, pageSize, totalPages, setPage: goTo, next, prev, hasNext: page < totalPages, hasPrev: page > 1, offset: (page - 1) * pageSize }
}
