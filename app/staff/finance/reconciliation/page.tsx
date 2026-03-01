import { redirect } from 'next/navigation'

export default function ReconciliationRedirect() {
  redirect('/staff/finance?tab=reconciliation')
}
