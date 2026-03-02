import { redirect } from 'next/navigation'

export default function MyBookingsPage() {
  redirect('/student/exam-pools?tab=my-bookings')
}
