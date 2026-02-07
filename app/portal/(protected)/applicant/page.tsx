import { Metadata } from 'next';
import ApplicantDashboardClient from './_components/ApplicantDashboardClient';

export const metadata: Metadata = {
  title: 'Applicant Portal',
};

export default function ApplicantPage() {
  return (
    <div className="p-4 md:p-8 space-y-6">
      <ApplicantDashboardClient />
    </div>
  );
}
