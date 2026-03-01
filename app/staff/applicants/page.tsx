import { redirect } from 'next/navigation'

export default function ApplicantsRedirect() {
  redirect('/staff/users?tab=applicants')
}