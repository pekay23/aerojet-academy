import { Metadata } from 'next';
import StaffCoursesClient from './_components/StaffCoursesClient';

export const metadata: Metadata = {
  title: 'Staff: Course Management',
};

export default function StaffCoursesPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <StaffCoursesClient />
    </div>
  );
}
