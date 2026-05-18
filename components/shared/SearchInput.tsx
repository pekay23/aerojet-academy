'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useDebounce } from '@/hooks/use-debounce'
import { useState, useEffect } from 'react'

interface SearchInputProps {
  placeholder?: string
  onSearch: (value: string) => void
  defaultValue?: string
  className?: string
}

export function SearchInput({
  placeholder = 'Search...',
  onSearch,
  defaultValue = '',
  className,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue)
  const debouncedValue = useDebounce(value, 300)

  useEffect(() => {
    onSearch(debouncedValue)
  }, [debouncedValue, onSearch])

  return (
    <div className={`relative ${className || ''}`}>
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="pr-9 pl-9"
      />
      {value && (
        <button
          aria-label="Clear search"
          onClick={() => setValue('')}
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
