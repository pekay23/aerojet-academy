"use client";
import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { useIdleTimer } from 'react-idle-timer';
import { toast } from 'sonner';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import PortalHeader from '@/app/components/portal-new/PortalHeader';
import ApplicantSidebar from '@/app/components/portal-new/ApplicantSidebar';

export default function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { redirect('/portal/login'); },
  });

  useIdleTimer({
    onIdle: () => { toast.warning("Session Expired"); signOut({ callbackUrl: '/portal/login' }); },
    timeout: 1000 * 60 * 30,
  });

  if (status === 'loading') return <div className="flex h-screen items-center justify-center animate-pulse">Loading Application...</div>;

  const user = session?.user as any;

  // 🔒 SECURITY: Route Protection
  
  // 1. If Staff/Admin, go to Staff Portal
  if (['ADMIN', 'STAFF', 'INSTRUCTOR'].includes(user?.role)) {
    router.replace('/staff/dashboard');
    return null;
  }

  // 2. If Active Student (Enrolled), go to Student Portal
  if (user?.role === 'STUDENT' && (user?.isActive || user?.enrollmentStatus === 'ENROLLED')) {
    router.replace('/student/dashboard');
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <ApplicantSidebar user={user} />
      <SidebarInset>
        <div className="flex items-center gap-2 px-4 border-b h-16 shrink-0 bg-card">
            <SidebarTrigger className="-ml-1" />
            <div className="flex-1"><PortalHeader onMenuClick={() => {}} title="Applicant Portal" /></div>
        </div>
        <main className="flex-1 overflow-y-auto p-4">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
