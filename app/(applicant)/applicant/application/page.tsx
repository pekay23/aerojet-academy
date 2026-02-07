import React from 'react';
import { Metadata } from 'next';
import ApplicationWizard from './_components/ApplicationWizard';

export const metadata: Metadata = {
  title: 'New Application | Aerojet Academy',
  description: 'Complete your admission profile.',
};

export default function ApplicationPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Application Form</h1>
        <p className="text-slate-500">Please complete all steps to submit your application for review.</p>
      </div>
      
      <ApplicationWizard />
    </div>
  );
}
