import { redirect } from 'next/navigation'

export default function AttendanceReportPage() {
  redirect('/staff/reports?tab=attendance')
}
