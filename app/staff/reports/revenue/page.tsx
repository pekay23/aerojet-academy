import { redirect } from 'next/navigation'

export default function RevenueReportPage() {
  redirect('/staff/reports?tab=revenue')
}
