'use client'

import { useState, useEffect } from 'react'

/**
 * Renders the current year only after client-side mount,
 * preventing hydration mismatches from `new Date()` in SSR.
 */
export default function ClientYear() {
  const [year, setYear] = useState<number | null>(null)

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
    setYear(new Date().getFullYear())
  }, [])

  return <>{year ?? ''}</>
}
