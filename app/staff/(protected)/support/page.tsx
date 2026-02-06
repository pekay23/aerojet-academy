import { Metadata } from 'next';
import SupportAdminClient from './_components/SupportAdminClient';

export const metadata: Metadata = {
  title: 'Staff: Support Messages',
};

export default function StaffSupportPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Support Inbox</h1>
        <p className="text-slate-500 mt-1">Manage and reply to student enquiries.</p>
      </div>
      <SupportAdminClient />
    </div>
  );
}
