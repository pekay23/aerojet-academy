"use client";

import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { useIdleTimer } from 'react-idle-timer';
import { toast } from 'sonner';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
// ✅ UPDATED IMPORTS: Point to 'portal', not 'portal-new'
import PortalHeader from '@/app/components/portal/PortalHeader';
import StudentSidebar from '@/app/components/portal/StudentSidebar';

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
      if (user.role !== 'STUDENT') {
        router.replace('/staff/dashboard');
      } else if (!user.isActive && user.enrollmentStatus !== 'ENROLLED') {
        // User is not active and not enrolled - redirect to applicant portal
        router.replace('/applicant/dashboard');
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

      <SidebarInset className="bg-background flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 border-b border-border h-16 shrink-0 bg-background sticky top-0 z-10 shadow-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1">
            <PortalHeader onMenuClick={() => { }} title="Student Portal" />
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
