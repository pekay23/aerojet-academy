'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import TablePagination from './TablePagination'

interface ClassesPaginationProps {
  page: number
  perPage: number
  total: number
  query?: string
}

export default function ClassesPagination({ page, perPage, total, query }: ClassesPaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateParams = (newPage: number, newPerPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (query) { params.set('query', query) } else { params.delete('query') }
    params.set('page', String(newPage))
    params.set('limit', String(newPerPage))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <TablePagination
      page={page}
      perPage={perPage}
      total={total}
      onPageChange={(p) => updateParams(p, perPage)}
      onPerPageChange={(pp) => updateParams(1, pp)}
    />
  )
}
