import { redirect } from 'next/navigation'

export default function ExamResultsRedirect() {
  redirect('/staff/exams?tab=results')
}
