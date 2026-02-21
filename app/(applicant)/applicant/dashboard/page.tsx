import React from 'react';
import ApplicantDashboardClient from './_components/ApplicantDashboardClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Applicant Portal',
};

export default function ApplicantDashboardPage() {
  return <ApplicantDashboardClient />;
}
