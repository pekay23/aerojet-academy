import { redirect } from 'next/navigation'

export default function InstructorsRedirect() {
  redirect('/staff/users?tab=instructors')
}

