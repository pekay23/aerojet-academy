import { redirect } from 'next/navigation'

export default function MyBookingsPage() {
  redirect('/student/exam-bookings?tab=my-bookings')
}
