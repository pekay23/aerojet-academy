import { redirect } from 'next/navigation'

export default function TransactionsRedirect() {
  redirect('/staff/finance?tab=transactions')
}
