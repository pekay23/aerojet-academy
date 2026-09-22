'use client'

import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-alert-dialog'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

const ConfirmDialogPrimitive = DialogPrimitive.Root

export interface ConfirmDialogOptions {
  title?: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
}

interface ConfirmDialogState extends ConfirmDialogOptions {
  open: boolean
  onConfirm: () => void
}

const ConfirmContext = React.createContext<{
  setState: React.Dispatch<React.SetStateAction<ConfirmDialogState | null>>
} | null>(null)

export function useConfirmDialog() {
  const [state, setState] = React.useState<ConfirmDialogState | null>(null)
  const ctx = React.useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirmDialog must be used within ConfirmDialogProvider')

  const confirm = React.useCallback(
    (options: ConfirmDialogOptions): Promise<boolean> =>
      new Promise((resolve) => {
        ctx.setState({
          open: true,
          onConfirm: () => resolve(true),
          ...options,
        })
      }),
    [ctx]
  )

  const handleCancel = React.useCallback(() => {
    ctx.setState((prev) => (prev ? { ...prev, open: false } : prev))
  }, [ctx])

  const handleConfirm = React.useCallback(() => {
    ctx.setState((prev) => {
      if (prev?.onConfirm) prev.onConfirm()
      return prev ? { ...prev, open: false } : prev
    })
  }, [ctx])

  const ConfirmDialogComponent = (
    <ConfirmDialogPrimitive
      open={state?.open ?? false}
      onOpenChange={(open) => {
        if (!open) handleCancel()
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg">
          <div className="flex flex-col space-y-2 text-center sm:text-left">
            <h2 className="text-lg font-semibold tracking-tight">
              {state?.title ?? 'Confirm'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {state?.description}
            </p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <button
              onClick={handleCancel}
              className={cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0')}
            >
              {state?.cancelLabel ?? 'Cancel'}
            </button>
            <button
              onClick={handleConfirm}
              className={cn(
                buttonVariants({ variant: state?.variant === 'destructive' ? 'destructive' : 'default' })
              )}
            >
              {state?.confirmLabel ?? 'Confirm'}
            </button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </ConfirmDialogPrimitive>
  )

  return { confirm, ConfirmDialogComponent, setState }
}

export function ConfirmDialogProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [, setState] = React.useState<ConfirmDialogState | null>(null)
  const value = React.useMemo(() => ({ setState }), [setState])

  return (
    <ConfirmContext.Provider value={value}>
      {children}
    </ConfirmContext.Provider>
  )
}