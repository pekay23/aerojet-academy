import { Metadata } from 'next';
import SupportClient from './_components/SupportClient';

export const metadata: Metadata = {
  title: 'Support & Notifications',
};

export default function SupportPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Support Center
        </h1>
        <p className="text-slate-500 mt-1">
          View your notifications and contact administration.
        </p>
      </div>
      <SupportClient />
    </div>
  );
}
