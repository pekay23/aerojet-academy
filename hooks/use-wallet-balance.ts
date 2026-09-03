'use client'
import { useState, useEffect } from 'react'

interface WalletData { balance: number; reservedBalance: number; currency: string }

export function useWalletBalance() {
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchWallet = async () => {
    try {
      const res = await fetch('/api/student/wallet')
      const data = await res.json()
      if (data.success) setWallet(data.data)
    } catch { /* ignore */ } finally { setLoading(false) }
  }

  // eslint-disable-next-line react-hooks/set-state-in-effect
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchWallet() }, [])

  const available = wallet ? wallet.balance - wallet.reservedBalance : 0
  return { wallet, available, loading, refetch: fetchWallet }
}
