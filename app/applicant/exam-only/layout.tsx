import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Exam Only Pathway | Applicant Portal',
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
