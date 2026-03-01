import { redirect } from 'next/navigation'

export default function WalletTopupsRedirect() {
  redirect('/staff/finance?tab=wallet-topups')
}
