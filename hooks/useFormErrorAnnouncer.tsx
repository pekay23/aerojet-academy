import { useEffect, useRef, useCallback } from 'react'

interface UseFormErrorAnnouncerOptions {
  errors?: Record<string, string>
  touched?: Record<string, boolean>
  errorId?: string
}

export function useFormErrorAnnouncer({ errors = {}, touched = {}, errorId = 'form-error-announcer' }: UseFormErrorAnnouncerOptions = {}) {
  const announcerRef = useRef<HTMLDivElement>(null)
  const previousErrorCount = useRef(0)

  const announce = useCallback((message: string) => {
    if (announcerRef.current) {
      announcerRef.current.textContent = message
    }
  }, [])

  useEffect(() => {
    const currentErrors = Object.entries(errors).filter(([key]) => touched[key])
    const errorCount = currentErrors.length

    if (errorCount > 0 && errorCount !== previousErrorCount.current) {
      const fieldNames = currentErrors.map(([, message]) => message).join('. ')
      announce(`Form has ${errorCount} error${errorCount > 1 ? 's' : ''}: ${fieldNames}`)
    }

    previousErrorCount.current = errorCount
  }, [errors, touched, announce])

  const getFieldErrorProps = useCallback(
    (fieldName: string) => {
      const hasError = touched[fieldName] && !!errors[fieldName]
      const errorId = `${fieldName}-error`

      return {
        'aria-invalid': hasError,
        'aria-describedby': hasError ? errorId : undefined,
        id: fieldName,
      }
    },
    [errors, touched]
  )

  const ErrorMessage = useCallback(
    ({ fieldName }: { fieldName: string }) => {
      if (!touched[fieldName] || !errors[fieldName]) return null

      return (
        <p id={`${fieldName}-error`} className="mt-1 text-sm text-red-600" role="alert">
          {errors[fieldName]}
        </p>
      )
    },
    [errors, touched]
  )

  return {
    announcerRef,
    announce,
    getFieldErrorProps,
    ErrorMessage,
    announcerId: errorId,
  }
}
