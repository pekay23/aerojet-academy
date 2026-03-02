import { redirect } from 'next/navigation'

export default function PendingGradingPage() {
  redirect('/instructor/grading?tab=pending')
}
