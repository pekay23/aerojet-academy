import { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'
import { Mail, ArrowRight, Clock } from 'lucide-react'
import RegistrationForm from './_components/RegistrationForm'
import PaymentInstructions from './_components/PaymentInstructions'
import { getRegistrationConfig } from '@/lib/settings'
import { getActivePaymentMethods } from '@/lib/payment-methods'

export const metadata: Metadata = { title: 'Register | Aerojet Academy' }

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; code?: string }>
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-2xl">
      <Suspense fallback={<RegisterSkeleton />}>
        <RegisterContent searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function RegisterContent({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; code?: string }>
}) {
  const params = await searchParams
  const isSuccess = params.success === 'true'
  const hasCode = !!params.code
  const showPaymentDetails = isSuccess && hasCode
  const config = await getRegistrationConfig()
  const paymentMethods = await getActivePaymentMethods()

  return (
    <>
      {/* Blue Header */}
      <div className="bg-aerojet-blue p-8 text-center text-white">
        <h2 className="text-3xl font-black tracking-tight uppercase">
          {showPaymentDetails
            ? 'Registration Complete'
            : isSuccess
              ? 'Check Your Email'
              : 'Start Your Journey'}
        </h2>
      </div>

      {/* Content */}
      <div className="p-8 md:p-10">
        {showPaymentDetails ? (
          <PaymentInstructions
            fee={config.fee}
            currency={config.currency}
            paymentMethods={paymentMethods}
          />
        ) : isSuccess ? (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-50">
              <Mail className="h-10 w-10 text-blue-500" />
            </div>
            <h3 className="mb-3 text-xl font-bold text-slate-800">Verify Your Email Address</h3>
            <p className="mb-6 text-base text-slate-500">
              We have sent a verification link to your email. Please check your inbox (and spam/junk
              folder) and click the link to complete your registration and receive payment details.
            </p>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-left">
              <div className="mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-bold text-blue-700 uppercase">What happens next</span>
              </div>
              <ol className="ml-5 list-decimal space-y-1 text-base text-blue-800">
                <li>Check your email and click the verification link.</li>
                <li>Upon verification, you'll get bank transfer details.</li>
                <li>Upload your payment receipt to complete your registration.</li>
                <li>Once approved, you will receive your portal login credentials.</li>
              </ol>
            </div>

            <div className="mt-6">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50"
              >
                <ArrowRight className="h-4 w-4" />
                Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <p className="text-base text-slate-500">
                Register to begin your application. A one-time fee of{' '}
                <strong className="text-aerojet-blue">
                  {config.currency} {config.fee}
                </strong>{' '}
                applies.
              </p>
            </div>

            <RegistrationForm currency={config.currency} fee={config.fee} />

            <div className="mt-6 border-t border-gray-100 pt-4 text-center text-base text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="font-bold text-aerojet-sky hover:underline">
                Sign in
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  )
}

function RegisterSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-32 bg-slate-100" />
      <div className="p-8 md:p-10">
        <div className="mb-4 h-6 w-1/2 bg-slate-50" />
        <div className="mb-6 h-10 w-full bg-slate-50" />
        <div className="h-48 w-full bg-slate-50" />
      </div>
    </div>
  )
}
