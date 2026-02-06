import { Metadata } from 'next';
import AdmissionsManagerClient from './_components/AdmissionsManagerClient';

export const metadata: Metadata = {
  title: 'Admin: Admissions Management',
};

export default function AdmissionsManagerPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admissions Manager</h1>
          <p className="text-slate-500 mt-1">Create and manage application windows and forms.</p>
        </div>
      </div>
      <AdmissionsManagerClient />
    </div>
  );
}
