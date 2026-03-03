import { redirect } from 'next/navigation'

// Pool joining is handled via the JoinPoolButton component on the pools browsing page.
// Redirect here to avoid confusion from the "Coming Soon" stub.
export default function Page() {
  redirect('/student/exam-pools')
}
