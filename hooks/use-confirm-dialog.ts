'use client'
import { useState, useCallback } from 'react'

interface ConfirmState {
  open: boolean
  title: string
  description: string
  onConfirm: () => void
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmState>({ open: false, title: '', description: '', onConfirm: () => {} })

  const confirm = useCallback((opts: { title: string; description: string; onConfirm: () => void }) => {
    setState({ open: true, ...opts })
  }, [])

  const close = useCallback(() => setState((s) => ({ ...s, open: false })), [])

  return { ...state, confirm, close, onOpenChange: (open: boolean) => { if (!open) close() } }
}
