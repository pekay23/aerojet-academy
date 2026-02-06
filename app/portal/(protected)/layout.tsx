"use client";

import React, { useState, useEffect } from 'react';
import PortalSidebar from '@/app/components/portal/PortalSidebar';
import PortalHeader from '@/app/components/portal/PortalHeader';
import { useSession, signOut } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { useIdleTimer } from 'react-idle-timer';
import { toast } from 'sonner';

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

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // --- IDLE TIMEOUT LOGIC ---
  const onIdle = () => {
    toast.warning("Session Expired", { description: "You have been logged out due to inactivity." });
    signOut({ callbackUrl: '/portal/login' });
  };

  useIdleTimer({
    onIdle,
    timeout: 1000 * 60 * 30, // 30 minutes
    throttle: 500,
  });
  // --- END IDLE TIMEOUT ---

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const user = session.user as any;
      
      if (['ADMIN', 'STAFF', 'INSTRUCTOR'].includes(user.role)) {
        router.replace('/staff/dashboard');
        return;
      }
      
      if (user.role === 'STUDENT' && !user.isActive) {
        router.replace('/portal/pending');
        return;
      }
    }
  }, [status, session, router]);

  const user = (session?.user as any);
  if (
    status === "loading" ||
    (user && ['ADMIN', 'STAFF', 'INSTRUCTOR'].includes(user.role)) ||
    (user && user.role === 'STUDENT' && !user.isActive)
  ) {
    return <div className="flex h-screen items-center justify-center text-aerojet-blue animate-pulse">Loading Portal...</div>;
  }

  if (!session || !session.user) return null;

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-slate-900/50">
      <div 
        className={`hidden lg:block h-full z-30 shrink-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <PortalSidebar 
          user={session.user} 
          collapsed={sidebarCollapsed} 
          setCollapsed={setSidebarCollapsed} 
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="lg:hidden">
            <PortalHeader onMenuClick={() => setMobileSidebarOpen(true)} />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          {children}
        </main>
      </div>

      {/* --- FIX IS HERE --- */}
      {mobileSidebarOpen && ( 
        <div className="lg:hidden fixed inset-0 z-50 flex" onClick={() => setMobileSidebarOpen(false)}>
          <div className="fixed inset-0 bg-black/50 transition-opacity"></div>
          <div className="relative w-64 h-full shadow-2xl animate-in slide-in-from-left-full duration-300">
            <PortalSidebar 
                user={session.user} 
                collapsed={false} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
