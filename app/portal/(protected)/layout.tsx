"use client";
import { useSession } from "next-auth/react";
import { redirect, useRouter } from "next/navigation"; // Import useRouter
import { useState, useEffect } from "react";
import PortalSidebar from "@/components/portal/PortalSidebar";
import PortalHeader from "@/components/portal/PortalHeader";

export default function PortalLayout({ children }: { children: React.ReactNode; }) {
  const router = useRouter(); // Use the router for client-side redirection
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
      const role = (session.user as any).role; // Access the role
      if (role === 'ADMIN' || role === 'STAFF') {
        router.replace('/staff/dashboard'); // Use 'replace' to avoid history stack issues
      }
    }
  }, [status, session, router]);

  // If loading or if user is admin (redirecting), show loading state
  // This prevents the "flash" of content
  if (status === "loading" || (session?.user as any)?.role === 'ADMIN') {
    return <div className="flex h-screen items-center justify-center text-aerojet-blue animate-pulse">Loading Portal...</div>;
  }

  // Safety check for user existence
  if (!session || !session.user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* ... (Rest of your layout code: Sidebar, Header, Main Content) ... */}
      <div className="hidden lg:block h-full shadow-xl z-30">
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
            <PortalSidebar user={session.user} collapsed={false} />
          </div>
        </div>
      )}
    </div>
  );
}
