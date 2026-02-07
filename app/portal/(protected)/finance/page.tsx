import { Metadata } from 'next';
import StudentFinanceClient from './_components/StudentFinanceClient';

export const metadata: Metadata = {
  title: 'My Finance',
};

export default function StudentFinancePage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Financial Ledger</h1>
        <p className="text-muted-foreground mt-1">Manage your invoices, payments, and receipts.</p>
      </div>
      <StudentFinanceClient />
    </div>
  );
}
