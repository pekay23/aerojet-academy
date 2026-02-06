"use client";

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import StaffSidebar from '@/app/components/staff/StaffSidebar';
import PortalHeader from '@/app/components/portal/PortalHeader';
import { useIdleTimer } from 'react-idle-timer';
import { toast } from 'sonner';

export default function StaffLayout({
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
  const handleOnIdle = () => {
    toast.warning("Session Expired", {
      description: "You have been logged out due to inactivity.",
      duration: 5000,
    });
    signOut({ callbackUrl: '/portal/login' });
  };

  useIdleTimer({
    onIdle: handleOnIdle,
    timeout: 1000 * 60 * 30, // 30 minutes
    throttle: 500,
  });
  // --- END IDLE TIMEOUT ---

  const user = session?.user as any;

  // Loading State
  if (status === "loading") {
    return <div className="flex h-screen items-center justify-center text-aerojet-blue animate-pulse">Loading Admin Portal...</div>;
  }

  // Security Redirect: If a Student somehow lands here, boot them to their own dashboard.
  if (user && user.role === 'STUDENT') {
    router.replace('/portal/dashboard');
    return <div className="flex h-screen items-center justify-center text-red-500">Redirecting...</div>;
  }
  
  if (!user) return null;

  return (
     <div className="flex h-screen bg-background transition-colors duration-300">
      <div 
        className={`hidden lg:block h-full z-30 shrink-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <StaffSidebar 
          user={user} 
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

      {/* Mobile Drawer */}
      {mobileSidebarOpen && ( 
        <div className="lg:hidden fixed inset-0 z-50 flex" onClick={() => setMobileSidebarOpen(false)}>
          <div className="fixed inset-0 bg-black/50 transition-opacity"></div>
          <div className="relative w-64 h-full shadow-2xl animate-in slide-in-from-left-full duration-300">
            <StaffSidebar 
                user={user} 
                collapsed={false} 
            />
          </div>
        </div>
      )}
    </div>
  );
}
