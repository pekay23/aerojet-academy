'use client'

import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface TMinusTooltipProps {
  days: number
  text?: string
}

export default function TMinusTooltip({ days, text }: TMinusTooltipProps) {
  const displayText = text || `T-${days}`
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center gap-1 border-b border-dashed border-slate-400 cursor-help font-bold text-current">
            {displayText} <Info className="h-3 w-3" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-800 text-slate-100 border-slate-700 z-100">
          <p>T-{days} means {days} days prior to the start date of the exam window.</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
