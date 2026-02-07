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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false); // Correct name

  // --- IDLE TIMEOUT LOGIC ---
  const handleOnIdle = () => {
    toast.warning("Session Expired", { description: "You have been logged out due to inactivity." });
    signOut({ callbackUrl: '/portal/login' });
  };

  useIdleTimer({
    onIdle: handleOnIdle,
    timeout: 1000 * 60 * 30, // 30 minutes
    throttle: 500,
  });
  // --- END IDLE TIMEOUT ---

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

  return (
    <div className="flex h-screen bg-background transition-colors duration-300 dashboard-theme">
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
            {/* FIX: Used mobileSidebarOpen */}
            <PortalHeader onMenuClick={() => setMobileSidebarOpen(!mobileSidebarOpen)} />
        </div>
        
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pt-6">
          {children}
        </main>
      </div>

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
