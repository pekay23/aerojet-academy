"use client";
import React, { useEffect, useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { useIdleTimer } from 'react-idle-timer';
import { toast } from 'sonner';
import { SidebarProvider, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import PortalHeader from '@/app/components/portal-new/PortalHeader';
// ✅ CORRECTED IMPORT PATH
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

  const SidebarWrapper = ({ user }: { user: any }) => {
  const { open, setOpen, isMobile } = useSidebar();
  
  if (isMobile) return null; // Or handle mobile drawer separately

  return (
    <StaffSidebar 
      user={user} 
      collapsed={!open} // Map context 'open' state to 'collapsed' prop
      setCollapsed={(val: boolean) => setOpen(!val)} 
    />
  );
};

const user = session?.user as any;

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex h-screen bg-muted/30">
        
          {/* ✅ 2. USE THE WRAPPER */}
          <SidebarWrapper user={user} />
          
          <div className="flex-1 flex flex-col h-screen overflow-y-auto">
            <header className="flex items-center gap-2 px-4 border-b h-16 shrink-0 bg-background sticky top-0 z-10 shadow-sm">
                <SidebarTrigger className="-ml-1" />
                <div className="flex-1">
                    <PortalHeader onMenuClick={() => {}} title="Staff Portal" />
                </div>
            </header>
            <main className="flex-1 p-4 sm:p-6 md:p-8">
                <div className="max-w-full">{children}</div>
            </main>
          </div>
      </div>
    </SidebarProvider>
  );
}