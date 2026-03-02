import { redirect } from 'next/navigation'

export default function AcademicCalendarPage() {
  redirect('/staff/settings?tab=calendar')
}
