import { Metadata } from 'next';
import StaffProfileClient from './_components/StaffProfileClient';

export const metadata: Metadata = {
  title: 'My Profile',
};

export default function StaffProfilePage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Profile</h1>
        <p className="text-slate-500 mt-1">Manage your account settings and appearance.</p>
      </div>
      <StaffProfileClient />
    </div>
  );
}
