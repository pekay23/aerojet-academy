"use client";

import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { useIdleTimer } from 'react-idle-timer';
import { toast } from 'sonner';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import PortalHeader from '@/app/components/portal-new/PortalHeader';
import StudentSidebar from '@/app/components/portal-new/StudentSidebar';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { redirect('/login'); },
  });

  const [isChecking, setIsChecking] = useState(true);

  useIdleTimer({
    onIdle: () => { toast.warning("Session Expired"); signOut({ callbackUrl: '/login' }); },
    timeout: 1000 * 60 * 30,
  });

  useEffect(() => {
    if (status === 'loading') return;

    const user = session?.user as any;

    if (user) {
        // Security Check
        if (user.role !== 'STUDENT') {
            router.replace('/staff/dashboard');
        } else if (!user.isActive && user.enrollmentStatus !== 'ENROLLED') {
            // Uncomment this when you want to enforce Applicant/Student separation
            // router.replace('/applicant/dashboard');
            setIsChecking(false); // TEMPORARY: Allow access for testing
        } else {
            setIsChecking(false);
        }
    }
  }, [status, session, router]);

  if (status === 'loading' || isChecking) {
      return <div className="flex h-screen items-center justify-center animate-pulse">Loading...</div>;
  }

  const user = session?.user as any;

  return (
    <SidebarProvider defaultOpen={true}>
      <StudentSidebar user={user} />
      
      <SidebarInset className="bg-muted/10 flex flex-col h-full">
        
        {/* Header */}
        <div className="flex items-center gap-2 px-4 border-b h-16 shrink-0 bg-background sticky top-0 z-10 shadow-sm">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
                <PortalHeader onMenuClick={() => {}} title="Student Portal" />
            </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
