'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface UnsavedChangesDialogProps {
  open: boolean
  onProceed: () => void
  onCancel: () => void
  /** Label of the tab the user is leaving from, e.g. "General" */
  fromLabel?: string
  /** Label of the tab the user is switching to, e.g. "Finance" */
  toLabel?: string
}

/**
 * Confirmation dialog shown when a user tries to switch tabs while a form has
 * unsaved changes. Use together with `useUnsavedChanges`.
 */
export function UnsavedChangesDialog({
  open,
  onProceed,
  onCancel,
  fromLabel,
  toLabel,
}: UnsavedChangesDialogProps) {
  const description =
    fromLabel && toLabel
      ? `You have unsaved changes on the ${fromLabel} tab. If you switch to ${toLabel}, your changes will be lost.`
      : fromLabel
        ? `You have unsaved changes on the ${fromLabel} tab. Your changes will be lost.`
        : 'You have unsaved changes. If you leave now, your changes will be lost.'

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Keep Editing</AlertDialogCancel>
          <AlertDialogAction
            onClick={onProceed}
            className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            Discard &amp; Switch
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
