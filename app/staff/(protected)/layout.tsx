"use client";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState } from "react";
import StaffSidebar from "@/components/staff/StaffSidebar";
import PortalHeader from "@/components/portal/PortalHeader"; // We can reuse this header

export default function StaffLayout({ children }: { children: React.ReactNode; }) {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() { redirect('/portal/login'); },
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (status === "loading") return <div className="flex h-screen items-center justify-center">Loading...</div>;

  // Role Check
  if (!session || (session.user as any).role === 'STUDENT') {
    return null; // The useEffect in PortalLayout handles the redirect, this is double safety
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="hidden lg:block h-full shadow-xl z-30">
        <StaffSidebar user={session.user} collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />
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
          <div className="fixed inset-0 bg-black/50" onClick={() => setMobileSidebarOpen(false)}></div>
          <div className="relative w-64 h-full shadow-2xl">
            <StaffSidebar user={session.user} collapsed={false} />
          </div>
        </div>
      )}
    </div>
  );
}
