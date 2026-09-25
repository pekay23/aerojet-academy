import { Metadata } from 'next'
import Link from 'next/link'
import LoginForm from './_components/LoginForm'

export const metadata: Metadata = { title: 'Sign In ' }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>
}) {
  const { returnTo } = await searchParams

  // Only allow relative paths to prevent open-redirect attacks
  const safeReturnTo =
    returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//') ? returnTo : undefined

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-aerojet-blue text-2xl font-black tracking-tight uppercase sm:text-3xl">
          Welcome Back
        </h2>
        <p className="mt-2 text-base text-slate-500 dark:text-slate-400">
          Sign in to your portal account.
        </p>
      </div>

      <LoginForm returnTo={safeReturnTo} />

      <div className="mt-8 text-center">
        <p className="text-base text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link href="/register" className="text-aerojet-sky font-bold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  )
}
