"use client";

import React, { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { useIdleTimer } from 'react-idle-timer';
import { toast } from 'sonner';

// --- IMPORTS ---
import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import PortalSidebar from '@/app/components/portal/PortalSidebar';
import PortalHeader from '@/app/components/portal/PortalHeader';

// ✅ FIXED IMPORT: Default import (no curly braces)
import ApplicantSidebar from '@/app/components/portal/sidebar/ApplicantSidebar';

// --- BRIDGE COMPONENT ---
const LegacySidebarWrapper = ({ user }: { user: any }) => {
  const { open, setOpen, isMobile } = useSidebar();
  
  return (
    <div className={`h-full border-r bg-card transition-all duration-300 ${open ? 'w-64' : 'w-20'} ${isMobile ? 'hidden' : 'block'}`}>
       <PortalSidebar 
          user={user} 
          collapsed={!open} 
          setCollapsed={(val) => setOpen(!val)} 
       />
    </div>
  );
};

export default function StudentPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/portal/login');
    },
  });

  useIdleTimer({
    onIdle: () => {
        toast.warning("Session Expired");
        signOut({ callbackUrl: '/portal/login' });
    },
    timeout: 1000 * 60 * 30, 
  });

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const user = session.user as any;
      if (['ADMIN', 'STAFF', 'INSTRUCTOR'].includes(user.role)) {
        router.replace('/staff/dashboard');
      }
    }
  }, [status, session, router]);

  const user = (session?.user as any);

  if (status === "loading" || !user) {
    return <div className="flex h-screen items-center justify-center text-aerojet-sky animate-pulse">Loading Portal...</div>;
  }

  const isEnrolled = user?.enrollmentStatus === 'ENROLLED';

  return (
    <SidebarProvider defaultOpen={true}>
      {isEnrolled ? (
        <LegacySidebarWrapper user={user} />
      ) : (
        <ApplicantSidebar />
      )}

      <SidebarInset>
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center gap-2 px-4 border-b h-16.25 shrink-0">
                <SidebarTrigger className="-ml-1" />
                <div className="flex-1">
                    <PortalHeader onMenuClick={() => {}} isEnrolled={isEnrolled} />
                </div>
            </div>

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pt-6">
                {children}
            </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
