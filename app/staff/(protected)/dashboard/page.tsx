import { Metadata } from 'next';
import DashboardClient from './_components/DashboardClient'; // You need to create this next

export const metadata: Metadata = {
  title: 'Staff Dashboard',
};

export default function StaffDashboardPage() { 
  return (
    <div className="p-4 md:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500">Overview of academy operations.</p>
      </div>
      
      {/* Load the client component that fetches the API data */}
      <DashboardClient />
    </div>
  );
}
