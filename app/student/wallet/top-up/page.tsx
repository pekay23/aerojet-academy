import { redirect } from 'next/navigation'

export default function TopUpRedirect() {
  redirect('/student/wallet?tab=top-up')
}
