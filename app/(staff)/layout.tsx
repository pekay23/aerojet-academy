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
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }
  
  const user = session?.user as any;

  return (
    <SidebarProvider defaultOpen={true}>
      {/* USE FLEX ROW to force side-by-side */}
      <div className="flex h-screen w-full bg-muted/20 overflow-hidden">
        
          {/* 1. Sidebar (Fixed Width managed by Shadcn) */}
          <div className="shrink-0 h-full">
             <StaffSidebar user={user} />
          </div>
          
          {/* 2. Content (Takes remaining space) */}
          <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
            <header className="flex items-center gap-2 px-4 border-b h-16 shrink-0 bg-background sticky top-0 z-10 shadow-sm w-full">
                <SidebarTrigger className="-ml-1" />
                <div className="flex-1">
                    <PortalHeader onMenuClick={() => {}} title="Staff Portal" />
                </div>
            </header>
            
            <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                {children}
            </main>
          </div>
      </div>
    </SidebarProvider>
  );
}
