'use client'
import { useSession } from 'next-auth/react'

export function useCurrentRole() {
  const { data: session } = useSession()
  return session?.user?.role ?? null
}
