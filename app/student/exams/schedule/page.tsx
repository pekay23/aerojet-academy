import { redirect } from 'next/navigation'

export default function ScheduleRedirect() {
  redirect('/student/exams?tab=bookings')
}
