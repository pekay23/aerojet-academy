import { redirect } from 'next/navigation'

export default function ApprovedPaymentsRedirect() {
  redirect('/staff/payments?tab=APPROVED')
}
