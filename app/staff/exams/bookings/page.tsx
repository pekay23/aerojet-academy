import { redirect } from 'next/navigation'

export default function ExamBookingsRedirect() {
  redirect('/staff/exams?tab=bookings')
}
