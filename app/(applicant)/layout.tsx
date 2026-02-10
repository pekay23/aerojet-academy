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
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { redirect('/login'); },
  });

  useIdleTimer({
    onIdle: () => { toast.warning("Session Expired"); signOut({ callbackUrl: '/login' }); },
    timeout: 1000 * 60 * 30,
  });

  if (status === 'loading') return <div className="flex h-screen items-center justify-center animate-pulse">Loading Application...</div>;

  const user = session?.user as any;

  // Security Checks
  if (['ADMIN', 'STAFF', 'INSTRUCTOR'].includes(user?.role)) {
    router.replace('/staff/dashboard');
    return null;
  }

  if (user?.role === 'STUDENT' && (user?.isActive || user?.enrollmentStatus === 'ENROLLED')) {
    router.replace('/student/dashboard');
    return null;
  }

  // --- NEW: Payment Verification Gate ---
  // We need to check if they have paid the registration fee.
  // Since we don't have fee status in session, we might need to fetch it or rely on a specialized hook.
  // For simplicity/performance in this layout, we'll fetch it once on mount.
  // Note: For a robust app, we should add feeStatus to session callback.
  const [isPaid, setIsPaid] = React.useState<boolean | null>(null);
  const pathname = usePathname(); // Correct usage

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
      } catch (e) {
        setIsPaid(false);
      }
    }
    checkFee();
  }, []);

  // While checking, maybe show loading or just render? 
  // If we block rendering, it might flash. 
  // Let's render but redirect if confirmed NOT paid and NOT on payment page.

  React.useEffect(() => {
    if (isPaid === false && !pathname.includes('/applicant/payment') && !pathname.includes('/support')) {
      router.replace('/applicant/payment');
    }
  }, [isPaid, pathname, router]);

  if (isPaid === null) return <div className="flex h-screen items-center justify-center animate-pulse"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>;


  return (
    <SidebarProvider defaultOpen={true}>
      <ApplicantSidebar user={user} />
      <SidebarInset className="bg-background">
        <div className="flex items-center gap-2 px-4 border-b border-border h-16 shrink-0 bg-background sticky top-0 z-10 shadow-sm">
          <SidebarTrigger className="-ml-1" />
          <div className="flex-1"><PortalHeader onMenuClick={() => { }} title="Applicant Portal" /></div>
        </div>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-muted/5">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
