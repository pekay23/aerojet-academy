import { redirect } from 'next/navigation'

export default function EnrollmentTrendsPage() {
  redirect('/staff/reports?tab=enrollment')
}
