"use client";
import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { useIdleTimer } from 'react-idle-timer';
import { toast } from 'sonner';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import PortalHeader from '@/app/components/portal-new/PortalHeader';
import StaffSidebar from '@/app/components/staff/StaffSidebar'; 

export default function StaffLayout({ children }: { children: React.ReactNode }) {
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
        if (!['ADMIN', 'STAFF', 'INSTRUCTOR'].includes(user.role)) {
            router.replace('/student/dashboard');
        } else {
            setIsChecking(false);
        }
    }
  }, [status, session, router]);

  if (status === 'loading' || isChecking) {
    return <div className="flex h-screen items-center justify-center">Loading Staff Portal...</div>;
  }
  
  const user = session?.user as any;

  return (
    <SidebarProvider defaultOpen={true}>
      {/* Change h-screen to h-full/min-h-screen to allow zoom adaptation */}
      <div className="flex w-full min-h-screen bg-muted/20">
        
          {/* Sidebar Container */}
          <div className="shrink-0 sticky top-0 h-screen overflow-hidden">
             <StaffSidebar user={user} />
          </div>
          
          {/* Content Container */}
          <div className="flex-1 flex flex-col min-w-0">
            <header className="flex items-center gap-2 px-4 border-b h-16 shrink-0 bg-background sticky top-0 z-50 shadow-sm w-full">
                <SidebarTrigger className="lg:hidden -ml-1" />
                <div className="flex-1">
                    <PortalHeader onMenuClick={() => {}} title="Staff Portal" />
                </div>
            </header>
            
            <main className="flex-1 p-4 sm:p-6 md:p-8 w-full">
                {children}
            </main>
          </div>
      </div>
    </SidebarProvider>
  );
}
