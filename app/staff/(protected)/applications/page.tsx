import { Metadata } from 'next';
import ApplicationsClient from './_components/ApplicationsClient';

export const metadata: Metadata = {
  title: 'Staff: Applications',
};

export default function StaffApplicationsPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Student Applications
          </h1>
          <p className="text-slate-500 mt-1">
            Review, approve, or reject incoming applications.
          </p>
        </div>
      </div>

      {/* Client Component to handle data and interactions */}
      <ApplicationsClient />
    </div>
  );
}
