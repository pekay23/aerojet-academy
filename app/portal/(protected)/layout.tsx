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

  // --- NEW: Instant Admin Redirect Check ---
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      const role = (session.user as any).role;
      if (role === 'ADMIN' || role === 'STAFF' || role === 'INSTRUCTOR') {
        console.log("Redirecting Staff Role:", role);
        router.replace('/staff/dashboard');
      }
    }
  }, [status, session, router]);

  if (status === "loading" || (session?.user as any)?.role === 'ADMIN') {
    return <div className="flex h-screen items-center justify-center text-aerojet-blue animate-pulse">Loading Portal...</div>;
  }

  if (!session || !session.user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 
         FIX APPLIED HERE:
         1. Added dynamic width classes to this wrapper div.
         2. Removed shadow-xl from here (the sidebar component handles it).
         3. This ensures the "flex" item is exactly 64 or 20 units wide.
      */}
      <div 
        className={`hidden lg:block h-full z-30 shrink-0 transition-all duration-300 ease-in-out ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* @ts-ignore */}
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
            {/* @ts-ignore */}
            <PortalSidebar user={session.user} collapsed={false} />
          </div>
        </div>
      )}
    </div>
  );
}
