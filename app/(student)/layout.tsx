"use client";
import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { useIdleTimer } from 'react-idle-timer';
import { toast } from 'sonner';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import PortalHeader from '@/app/components/portal-new/PortalHeader';
// IMPORT FROM THE NEW FOLDER 👇
import StudentSidebar from '@/app/components/portal-new/StudentSidebar';

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { redirect('/login'); },
  });

  useIdleTimer({
    onIdle: () => { toast.warning("Session Expired"); signOut({ callbackUrl: '/login' }); },
    timeout: 1000 * 60 * 30,
  });

  if (status === 'loading') return <div className="flex h-screen items-center justify-center animate-pulse">Loading...</div>;

  const user = session?.user as any;

  // ⚠️ TEMPORARY DEV: Comment this out to test the UI
  
  if (user?.role !== 'STUDENT') {
    router.replace('/staff/dashboard');
    return null;
  }
  if (!user?.isActive && user?.enrollmentStatus !== 'ENROLLED') {
     router.replace('/applicant/dashboard');
     return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <StudentSidebar user={user} />
      
      {/* ADDED: bg-muted/10 gives a subtle contrast to the white content cards */}
      <SidebarInset className="bg-muted/10 flex flex-col h-full">
        
        {/* Header */}
        <div className="flex items-center gap-2 px-4 border-b h-16 shrink-0 bg-background sticky top-0 z-10 shadow-sm">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1">
                <PortalHeader onMenuClick={() => {}} title="Student Portal" />
            </div>
        </div>

        {/* Main Content: Added max-width for better readability on large screens */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}