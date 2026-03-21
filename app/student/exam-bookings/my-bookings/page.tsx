import { redirect } from 'next/navigation'

export default function MyBookingsPage() {
  redirect('/student/exams?tab=bookings')
}
