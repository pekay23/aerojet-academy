import { Metadata } from 'next';
import UserManagementClient from './_components/UserManagementClient';

export const metadata: Metadata = {
  title: 'Admin: User Management',
};

export default function UserManagementPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          User Directory
        </h1>
        <p className="text-slate-500 mt-1">
          Manage system access, assign roles, and activate accounts.
        </p>
      </div>
      <UserManagementClient />
    </div>
  );
}
