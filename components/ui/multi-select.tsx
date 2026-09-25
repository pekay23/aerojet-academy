'use client'

import * as React from 'react'
import { X, ChevronsUpDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface Option {
  label: string
  value: string
}

interface MultiSelectProps {
  options: Option[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  className?: string
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select items...',
  className,
}: MultiSelectProps) {
  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item))
  }

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value))
    } else {
      onChange([...selected, value])
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn(
            'focus:ring-aerojet-blue flex h-auto min-h-10 w-full items-center justify-between rounded-xl px-3 py-2 hover:bg-transparent focus:ring-2 focus:ring-offset-2',
            className
          )}
        >
          <div className="flex flex-wrap gap-1">
            {selected.length === 0 && (
              <span className="text-sm font-medium text-slate-400">{placeholder}</span>
            )}
            {selected.map((item) => {
              const option = options.find((o) => o.value === item)
              return (
                <Badge
                  key={item}
                  variant="secondary"
                  className="text-aerojet-blue flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-bold dark:bg-blue-900/30 dark:text-blue-300"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleUnselect(item)
                  }}
                >
                  {option?.label || item}
                  <button
                    className="ring-offset-background focus:ring-ring ml-1 rounded-full outline-none focus:ring-2 focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUnselect(item)
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleUnselect(item)
                    }}
                  >
                    <X className="h-3 w-3 text-slate-400 hover:text-slate-900" />
                  </button>
                </Badge>
              )
            })}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="max-h-300 w-full min-w-(--radix-dropdown-menu-trigger-width) overflow-y-auto p-1">
        {options.map((option) => (
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={selected.includes(option.value)}
            onCheckedChange={() => toggleOption(option.value)}
            onSelect={(e) => e.preventDefault()}
            className="rounded-lg px-2 py-2 text-sm font-medium"
          >
            {option.label}
          </DropdownMenuCheckboxItem>
        ))}
        {options.length === 0 && (
          <div className="px-2 py-4 text-center text-xs text-slate-400">No options available</div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
