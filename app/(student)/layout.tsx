"use client";

import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
// ✅ UPDATED IMPORTS: Point to 'portal', not 'portal-new'
import PortalHeader from '@/app/components/portal/PortalHeader';
import StudentSidebar from '@/app/components/portal/StudentSidebar';

interface StudentUser {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: string;
  isActive: boolean;
  enrollmentStatus?: string;
}

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { redirect('/login'); },
  });

  const user = session?.user as unknown as StudentUser | undefined;
  // Derived authorization state - no useState needed
  // Check if user exists and meets criteria
  const isAuthorized = user && 
    user.role === 'STUDENT' && 
    (user.isActive || user.enrollmentStatus === 'ENROLLED');

  const isLoading = status === 'loading';

  useEffect(() => {
    if (isLoading || !user) return;

    if (!isAuthorized) {
       // Handle unauthorized redirects
       if (user.role !== 'STUDENT') {
         router.replace('/staff/dashboard');
       } else {
         // Not active/enrolled -> Applicant
         router.replace('/applicant/dashboard');
       }
    }
  }, [isLoading, user, isAuthorized, router]);

  if (isLoading || !isAuthorized) {
    return <div className="flex h-screen items-center justify-center animate-pulse">Loading...</div>;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <StudentSidebar user={{
          name: user?.name || 'Student',
          email: user?.email || '',
          image: user?.image || undefined
      }} />

      <SidebarInset className="bg-background flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 border-b border-border h-16 shrink-0 bg-background sticky top-0 z-10 shadow-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <PortalHeader />
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-muted/5">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
