import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getAuthSession } from '@/lib/auth/helpers'
import prisma from '@/lib/prisma/client'
import PaymentUploadForm from './_components/PaymentUploadForm'

export const metadata: Metadata = { title: 'Upload Payment | Applicant Portal' }
export const dynamic = 'force-dynamic'

export default async function PaymentPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  const userId = session.user.id

  const applicant = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      registrationFee: true,
      registrationCurrency: true,
      registrationPaid: true,
      paymentProofUrl: true,
    },
  })

  if (!applicant) redirect('/login')

  // Fetch global registration settings and bank details
  const settings = await prisma.systemSetting.findMany({
    where: {
      key: {
        in: [
          'bank_name',
          'bank_account_name',
          'bank_account_number',
          'bank_swift',
          'bank_branch',
          'registration_fee',
          'registration_currency',
        ],
      },
    },
  })

  const globalSettings: Record<string, string> = {}
  for (const s of settings) {
    globalSettings[s.key] = s.value
  }

  const registrationFee = globalSettings.registration_fee || '350'
  const registrationCurrency = globalSettings.registration_currency || 'EUR'

  return (
    <div className="max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-aerojet-blue dark:text-white">
          Upload Payment Proof
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Upload proof of your {registrationFee} {registrationCurrency} registration payment.
        </p>
      </div>

      {/* Already paid */}
      {applicant.registrationPaid ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
          <p className="font-bold text-green-700">
            ✅ Your registration payment has been verified.
          </p>
          <p className="mt-1 text-sm text-green-600">
            No further action is needed for your registration fee.
          </p>
        </div>
      ) : (
        <>
          {/* Bank Details */}
          <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 className="mb-4 font-bold text-slate-900 dark:text-slate-100">Bank Transfer Details</h2>
            <dl className="space-y-3 text-sm">
              {[
                { label: 'Bank', value: globalSettings.bank_name },
                { label: 'Account Name', value: globalSettings.bank_account_name },
                { label: 'Account Number', value: globalSettings.bank_account_number },
                { label: 'Swift / BIC', value: globalSettings.bank_swift },
                { label: 'Branch', value: globalSettings.bank_branch },
                {
                  label: 'Amount',
                  value: `${registrationFee} ${registrationCurrency}`,
                },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex items-start justify-between gap-4 border-b border-slate-50 pb-2 last:border-0"
                >
                  <dt className="w-36 shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {label}
                  </dt>
                  <dd className="text-right font-mono font-bold text-slate-800 dark:text-slate-200">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Upload Form */}
          <PaymentUploadForm existingProofUrl={applicant.paymentProofUrl} />
        </>
      )}
    </div>
  )
}
