import { redirect } from 'next/navigation'

export default function TransactionsRedirect() {
  redirect('/student/wallet?tab=transactions')
}
