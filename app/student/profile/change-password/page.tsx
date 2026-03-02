import { redirect } from 'next/navigation'

export default function ChangePasswordPage() {
  redirect('/student/profile?tab=password')
}
