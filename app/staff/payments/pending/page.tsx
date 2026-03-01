import { redirect } from 'next/navigation'

export default function PendingPaymentsRedirect() {
  redirect('/staff/payments?tab=PENDING')
}
