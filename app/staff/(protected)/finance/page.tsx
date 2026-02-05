import { Metadata } from 'next';
import FinanceClient from './_components/FinanceClient';

export const metadata: Metadata = {
  title: 'Staff: Finance Verification',
};

export default function StaffFinancePage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Payment Verification
        </h1>
        <p className="text-slate-500 mt-1">
          Review uploaded proofs of payment and confirm transactions.
        </p>
      </div>

      <FinanceClient />
    </div>
  );
}
