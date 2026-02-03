"use client";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import PortalSidebar from "@/components/portal/PortalSidebar";
import PortalHeader from "@/components/portal/PortalHeader";

export default function PortalLayout({ children }: { children: React.ReactNode; }) {
  const router = useRouter();
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/portal/login');
    },
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // --- Role & Activation Redirect Logic ---
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const user = session.user as any;
      
      // 1. If user is ADMIN/STAFF/INSTRUCTOR, redirect to staff portal
      if (['ADMIN', 'STAFF', 'INSTRUCTOR'].includes(user.role)) {
        router.replace('/staff/dashboard');
        return;
      }
      
      // 2. If user is a STUDENT but not yet active, redirect to pending page
      if (user.role === 'STUDENT' && !user.isActive) {
        router.replace('/portal/pending');
        return;
      }
    }
  }, [status, session, router]);

  // Loading state should check for all redirect conditions to prevent content flashes
  const user = (session?.user as any);
  if (
    status === "loading" ||
    (user && ['ADMIN', 'STAFF', 'INSTRUCTOR'].includes(user.role)) ||
    (user && user.role === 'STUDENT' && !user.isActive)
  ) {
    return <div className="flex h-screen items-center justify-center text-aerojet-blue animate-pulse">Loading Portal...</div>;
  }

  // Final safety check
  if (!session || !session.user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
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

      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={() => setMobileSidebarOpen(false)}></div>
          <div className="relative w-64 h-full shadow-2xl">
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
