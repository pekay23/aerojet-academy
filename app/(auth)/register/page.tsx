import { Metadata } from 'next'
import Link from 'next/link'
import RegistrationForm from './_components/RegistrationForm'
import PaymentInstructions from './_components/PaymentInstructions'

export const metadata: Metadata = { title: 'Register | Aerojet Academy' }

import { getRegistrationConfig, getFinanceConfig } from '@/lib/settings'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; code?: string }>
}) {
  const params = await searchParams
  const isSuccess = params.success === 'true'
  const config = await getRegistrationConfig()
  const finance = await getFinanceConfig()

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
      {/* Blue Header */}
      <div className="bg-[#002a5c] p-8 text-center text-white">
        <h2 className="text-3xl font-black tracking-tight uppercase">
          {isSuccess ? 'Registration Complete' : 'Start Your Journey'}
        </h2>
      </div>

      {/* Content */}
      <div className="p-8 md:p-10">
        {isSuccess ? (
          <PaymentInstructions fee={config.fee} currency={config.currency} finance={finance} />
        ) : (
          <>
            <div className="mb-8">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Register to begin your application. A one-time fee of{' '}
                <strong className="text-[#002a5c]">
                  {config.currency} {config.fee}
                </strong>{' '}
                applies.
              </p>
            </div>

            <RegistrationForm />

            <div className="mt-6 border-t border-gray-100 pt-4 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-[#4c9ded] hover:underline">
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
