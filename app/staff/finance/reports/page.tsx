import { redirect } from 'next/navigation'

export default function FinanceReportsRedirect() {
  redirect('/staff/finance?tab=reports')
}
