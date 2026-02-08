import React from 'react';
import { Metadata } from 'next';
import ApplicationWizard from './_components/ApplicationWizard';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const metadata: Metadata = { title: 'New Application' };

export default async function ApplicationPage() {
  const session = await getServerSession(authOptions);
  
  // Fetch user details from DB to get phone (which might be in Student profile)
  const user = await prisma.user.findUnique({
    where: { id: (session?.user as any)?.id },
    include: { studentProfile: true }
  });

  // Prepare pre-fill data
  const initialData = {
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    phone: user?.studentProfile?.phone || ''
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Application Form</h1>
        <p className="text-slate-500">Please review and complete your details.</p>
      </div>
      {/* Pass data to component */}
      <ApplicationWizard initialData={initialData} />
    </div>
  );
}
