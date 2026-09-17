'use client'


import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DatePickerProps {
  date?: Date
  onSelect: (date: Date | undefined) => void
  placeholder?: string
}

export function DatePicker({ date, onSelect, placeholder = 'Pick a date' }: DatePickerProps) {
  return (
    <div className="relative">
      <Button variant="outline" className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}>
        <CalendarIcon className="mr-2 h-4 w-4" />
        {date ? format(date, 'PPP') : placeholder}
      </Button>
      {date && (
        <input type="date" value={format(date, 'yyyy-MM-dd')} onChange={(e) => onSelect(e.target.value ? new Date(e.target.value) : undefined)}
          className="absolute inset-0 cursor-pointer opacity-0" />
      )}
      {!date && (
        <input type="date" onChange={(e) => onSelect(e.target.value ? new Date(e.target.value) : undefined)}
          className="absolute inset-0 cursor-pointer opacity-0" />
      )}
    </div>
  )
}
