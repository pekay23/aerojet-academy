import { Metadata } from 'next';
import CommunicationClient from './_components/CommunicationClient';

export const metadata: Metadata = {
  title: 'Staff: Communication',
};

export default function CommunicationPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Communication Hub
        </h1>
        <p className="text-slate-500 mt-1">
          Send announcements and emails to students, staff, or specific cohorts.
        </p>
      </div>
      <CommunicationClient />
    </div>
  );
}
