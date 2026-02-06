import { Metadata } from 'next';
import StudentDashboardClient from './_components/StudentDashboardClient';

export const metadata: Metadata = {
  title: 'Student Dashboard',
};

export default function DashboardPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <StudentDashboardClient />
    </div>
  );
}
