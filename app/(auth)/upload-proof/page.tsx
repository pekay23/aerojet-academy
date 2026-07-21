import { Metadata } from 'next'
import Link from 'next/link'
import UploadProofForm from './_components/UploadProofForm'

export const metadata: Metadata = { title: 'Upload Payment Proof ' }

export default function UploadProofPage() {
  return (
    <div>
      <div className="mb-8">
        <h2 className="dark:text-aerojet-blue text-aerojet-blue text-2xl font-black tracking-tight uppercase sm:text-3xl">
          Upload Proof
        </h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Submit your payment receipt to complete registration.
        </p>
      </div>

      <UploadProofForm />

      <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
        <p className="text-center text-[10px] tracking-widest text-slate-400 uppercase">
          Secure upload powered by Aerojet Academy Admissions
        </p>
      </div>
    </div>
  )
}
