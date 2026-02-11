"use client";
import React from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { useIdleTimer } from 'react-idle-timer';
import { toast } from 'sonner';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Loader2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
// ✅ UPDATED IMPORTS
import PortalHeader from '@/app/components/portal/PortalHeader';
import ApplicantSidebar from '@/app/components/portal/ApplicantSidebar';

export default function ApplicantLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { redirect('/login'); },
  });

  useIdleTimer({
    onIdle: () => { toast.warning("Session Expired"); signOut({ callbackUrl: '/login' }); },
    timeout: 1000 * 60 * 30,
  });
  const user = session?.user as { role: string; isActive?: boolean; enrollmentStatus?: string } | undefined;
  const router = useRouter();
  const pathname = usePathname();

  // --- NEW: Payment Verification Gate & Role Checks ---
  // Hooks must run unconditionally
  const [isPaid, setIsPaid] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    async function checkFee() {
      try {
        const res = await fetch('/api/applicant/registration-fee');
        const data = await res.json();
        if (data?.fee?.status === 'PAID') {
          setIsPaid(true);
        } else {
          setIsPaid(false);
        }
      } catch {
        setIsPaid(false);
      }
    }
    // Only check fee if user is actually an applicant
    if (user?.role === 'APPLICANT' || !user?.role) {
      checkFee();
    } else {
      setIsPaid(true); // Bypass for others to allow redirect logic to handle them
    }
  }, [user?.role]);

  // Security & Redirect Logic
  React.useEffect(() => {
    if (status === 'loading') return;

    // 1. Redirect non-applicants
    if (['ADMIN', 'STAFF', 'INSTRUCTOR'].includes(user?.role || '')) {
      router.replace('/staff/dashboard');
      return;
    }

    // 2. Redirect enrolled students
    if (user?.role === 'STUDENT' && (user?.isActive || user?.enrollmentStatus === 'ENROLLED')) {
      router.replace('/student/dashboard');
      return;
    }

    // 3. Payment Gate for Applicants
    if (isPaid === false && !pathname?.includes('/applicant/payment') && !pathname?.includes('/support')) {
      router.replace('/applicant/payment');
    }
  }, [user, status, isPaid, pathname, router]);

  if (status === 'loading' || isPaid === null) return <div className="flex h-screen items-center justify-center animate-pulse"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;


  return (
    <SidebarProvider defaultOpen={true}>
      <ApplicantSidebar />
      <SidebarInset className="bg-background">
        <div className="flex items-center gap-2 px-4 border-b border-border h-16 shrink-0 bg-background sticky top-0 z-10 shadow-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1"><PortalHeader /></div>
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-muted/5">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
