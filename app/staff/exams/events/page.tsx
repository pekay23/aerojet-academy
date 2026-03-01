import { redirect } from 'next/navigation'

export default function ExamEventsRedirect() {
  redirect('/staff/exams?tab=events')
}
