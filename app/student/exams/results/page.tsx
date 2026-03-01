import { redirect } from 'next/navigation'

export default function ResultsRedirect() {
  redirect('/student/exams?tab=results')
}
