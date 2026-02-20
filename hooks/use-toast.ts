'use client'
import { toast as sonnerToast } from 'sonner'

export const toast = sonnerToast

export function useToast() {
  return {
    success: (message: string) => toast.success(message),
    error: (message: string) => toast.error(message),
    info: (message: string) => sonnerToast.info(message),
    warning: (message: string) => sonnerToast.warning(message),
    loading: (message: string) => sonnerToast.loading(message),
    dismiss: (id?: string | number) => sonnerToast.dismiss(id),
    promise: sonnerToast.promise,
  }
}
