'use client'

import { Search } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useDebouncedCallback } from 'use-debounce'

export default function SearchInput({
  placeholder,
  id = 'global-search-input',
}: {
  placeholder: string
  id?: string
}) {
  const searchParams = useSearchParams()
  const { replace } = useRouter()

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams)
    if (term) {
      params.set('query', term)
    } else {
      params.delete('query')
    }
    replace(`${window.location.pathname}?${params.toString()}`)
  }, 300)

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        id={id}
        name={id}
        type="text"
        placeholder={placeholder}
        className="h-10 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-sm focus:border-aerojet-blue focus:outline-none focus:ring-1 focus:ring-aerojet-blue"
        onChange={(e) => handleSearch(e.target.value)}
        defaultValue={searchParams.get('query')?.toString()}
        autoComplete="off"
      />
    </div>
  )
}
