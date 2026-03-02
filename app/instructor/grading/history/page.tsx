import { redirect } from 'next/navigation'

export default function GradingHistoryPage() {
  redirect('/instructor/grading?tab=history')
}
