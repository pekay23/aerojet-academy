import React from 'react';
import ExamPoolsClient from './_components/ExamPoolsClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Exam Marketplace | Student Portal',
};

export default function ExamPoolsPage() {
  return <ExamPoolsClient />;
}
