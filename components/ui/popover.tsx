'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { cn } from '@/lib/utils'

const Popover = PopoverPrimitive.Root
const PopoverTrigger = PopoverPrimitive.Trigger
const PopoverPortal = PopoverPrimitive.Portal

type PopoverContentProps = React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
  sideOffset?: number
  align?: 'start' | 'end'
  collisionPadding?: number
  hideArrow?: boolean
}

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>((props, ref) => {
  const {
    className,
    children,
    sideOffset = 4,
    align = 'start',
    collisionPadding = 4,
    hideArrow = false,
    ...rest
  } = props

  return (
    <PopoverPortal>
      <PopoverPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        align={align}
        collisionPadding={collisionPadding}
        className={cn(
          'bg-popover text-popover-foreground z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md',
          'data-[state=open]:animate-in data-[state=closed]:animate-out',
          'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1',
          'data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
          className
        )}
        {...rest}
      >
        {!hideArrow && (
          <PopoverPrimitive.Arrow
            className={cn(
              'data-[state=open]:animate-in data-[state=closed]:animate-out h-4 w-4',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0'
            )}
          />
        )}
        {children}
      </PopoverPrimitive.Content>
    </PopoverPortal>
  )
})

PopoverContent.displayName = 'PopoverContent'

export { Popover, PopoverTrigger, PopoverContent }
