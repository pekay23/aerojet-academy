import React from 'react';
import DashboardClient from './_components/DashboardClient'; // Make sure this path is correct

export default function StaffDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Admin Dashboard</h1>
      <DashboardClient />
    </div>
  );
}
