import React from 'react';
import StudentDashboardClient from './_components/StudentDashboardClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Student Portal',
};

export default function StudentDashboardPage() {
  return <StudentDashboardClient />;
}
