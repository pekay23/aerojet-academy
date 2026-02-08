import React from 'react';
import StudentFinanceClient from './_components/StudentFinanceClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My Finance | Student Portal',
};

export default function FinancePage() {
  return <StudentFinanceClient />;
}
