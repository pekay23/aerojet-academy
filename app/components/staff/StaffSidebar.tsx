"use client";
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from "next-auth/react";
import { User } from 'next-auth';
import { toast } from 'sonner';
import { useState } from 'react';
import ConfirmationModal from '@/components/modal/ConfirmationModal';

// Admin Icons
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Applications: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Finance: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Exams: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Students: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  SignOut: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Collapse: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>,
  Expand: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>,
};

const menuItems = [
  { title: "Dashboard", href: "/staff/dashboard", icon: Icons.Dashboard },
  { title: "Applications", href: "/staff/applications", icon: Icons.Applications },
  { title: "Exam Management", href: "/staff/exams", icon: Icons.Exams },
  { title: "Finance & Verify", href: "/staff/finance", icon: Icons.Finance },
  { title: "Students", href: "/staff/students", icon: Icons.Students }, // We will build this next
  { title: "Settings", href: "/staff/settings", icon: Icons.Settings }, // For Rooms/Modules
];

export default function StaffSidebar({ 
  user, 
  collapsed = false, 
  setCollapsed 
}: { 
  user: User; 
  collapsed?: boolean; 
  setCollapsed?: (val: boolean) => void;
}) {
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const pathname = usePathname();

  const handleSignOut = () => {
    toast.promise(signOut({ callbackUrl: '/' }), {
      loading: 'Signing out...', success: 'Signed out.', error: 'Failed.'
    });
  };

  // Uses Aerojet Navy (darker) to distinguish from Student Portal
  return (
    <>
      <aside className={`bg-slate-900 text-white flex flex-col h-full shadow-xl transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
        
        {/* Toggle Button */}
        {setCollapsed && (
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:block absolute -right-3 top-8 bg-slate-700 text-white p-1 rounded-full shadow-md z-50 border border-slate-600">
            {collapsed ? <Icons.Expand /> : <Icons.Collapse />}
          </button>
        )}

        <div className="h-16 flex items-center justify-center border-b border-white/10 mx-4">
          <Link href="/">
            {collapsed ? (
              <span className="font-bold text-xl">AA</span>
            ) : (
              <Image src="/ATA_logo_hor_onDark.png" alt="Aerojet Academy" width={140} height={35} className="object-contain" />
            )}
          </Link>
        </div>
        
        <div className={`py-6 text-center ${collapsed ? 'px-2' : 'px-4'}`}>
          <div className={`rounded-full bg-slate-700 flex items-center justify-center font-bold text-white transition-all mx-auto ${collapsed ? 'w-10 h-10 text-sm' : 'w-16 h-16 text-xl'}`}>
            {user.name?.[0]}
          </div>
          {!collapsed && (
            <div className="mt-3">
              <p className="font-semibold text-sm truncate">{user.name}</p>
              <span className="text-[10px] bg-red-600 px-2 py-0.5 rounded text-white font-bold uppercase tracking-wider">ADMIN</span>
            </div>
          )}
        </div>

        <nav className="grow space-y-1 px-3 mt-2 no-scrollbar overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.title} href={item.href} className={`flex items-center px-3 py-3 rounded-lg transition-all group ${isActive ? "bg-blue-600 text-white font-bold" : "text-slate-400 hover:bg-white/5 hover:text-white"} ${collapsed ? 'justify-center' : ''}`} title={collapsed ? item.title : ''}>
                <item.icon />
                {!collapsed && <span className="ml-3 text-sm">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={() => setIsSignOutModalOpen(true)} className={`flex items-center w-full p-2 rounded-lg text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors ${collapsed ? 'justify-center' : ''}`} title="Sign Out">
            <Icons.SignOut />
            {!collapsed && <span className="ml-3 text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      <ConfirmationModal isOpen={isSignOutModalOpen} onClose={() => setIsSignOutModalOpen(false)} onConfirm={handleSignOut} title="Sign Out" message="Exit Admin Console?"/>
    </>
  );
}
