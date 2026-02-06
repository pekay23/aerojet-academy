"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from "next-auth/react";
import { User } from 'next-auth';
import { toast } from 'sonner';
import { useState } from 'react';
import ConfirmationModal from '@/components/modal/ConfirmationModal';

// --- Icons ---
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Courses: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Exams: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
  Results: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Finance: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Wallet: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
  Profile: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
  SignOut: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Collapse: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>,
  Expand: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>,
  Support: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  // Staff Icons
  Applications: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
};

// --- Menu Data Definitions ---
const studentMenu = [
  { title: "Dashboard", href: "/portal/dashboard", icon: Icons.Dashboard },
  { title: "My Courses", href: "/portal/courses", icon: Icons.Courses },
  { title: "Exam Bookings", href: "/portal/exams", icon: Icons.Exams },
  { title: "Results", href: "/portal/results", icon: Icons.Results },
  { title: "Finance & Ledger", href: "/portal/finance", icon: Icons.Finance },
  { title: "Exam Wallet", href: "/portal/wallet", icon: Icons.Wallet },
  { title: "Support", href: "/portal/support", icon: Icons.Support },
  { title: "My Profile", href: "/portal/profile", icon: Icons.Profile },
];

const staffMenu = [
  { title: "Dashboard", href: "/staff/dashboard", icon: Icons.Dashboard },
  { title: "Applications", href: "/staff/applications", icon: Icons.Applications },
  { title: "Course Manager", href: "/staff/courses", icon: Icons.Courses },
  { title: "Exam Scheduling", href: "/staff/exams", icon: Icons.Exams },
  { title: "Results Entry", href: "/staff/results", icon: Icons.Results },
  { title: "Finance Verify", href: "/staff/finance", icon: Icons.Finance },
  { title: "User Directory", href: "/staff/users", icon: Icons.Users },
  { title: "Support Inbox", href: "/staff/support", icon: Icons.Support },
];

export default function PortalSidebar({ 
  user, 
  collapsed = false, 
  setCollapsed 
}: { 
  user: User & { role?: string }; // Extend user type to include role
  collapsed?: boolean; 
  setCollapsed?: (val: boolean) => void;
}) {
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const pathname = usePathname();

  const userRole = (user?.role || 'STUDENT');
  const isStudent = userRole === 'STUDENT';
  
  // Decide which menu to show
  const items = (userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'INSTRUCTOR') 
    ? staffMenu 
    : studentMenu;

  const handleSignOut = () => {
    toast.promise(signOut({ callbackUrl: '/portal/login' }), {
      loading: 'Signing out...',
      success: 'You have been signed out.',
      error: 'Failed to sign out.',
    });
  };

  return (
    <>
      <aside 
        className={`bg-aerojet-blue text-white flex flex-col h-full shadow-xl transition-[width] duration-300 ease-in-out relative ${
          collapsed ? 'w-20' : 'w-64'
      }`}
    >
        {/* Toggle Button */}
        {setCollapsed && (
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex absolute -right-3 top-20 bg-aerojet-sky text-white p-1.5 rounded-full shadow-md z-50 items-center justify-center border-2 border-white hover:bg-aerojet-soft-blue transition-colors"
          >
            {collapsed ? <Icons.Expand /> : <Icons.Collapse />}
          </button>
        )}

        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-white/10 mx-4 shrink-0">
          <Link href="/">
            {collapsed ? (
              <Image src="/android-chrome-512x512.png" alt="AA" width={32} height={32} className="object-contain" />
            ) : (
              <Image src="/ATA_logo_hor_onDark.png" alt="Aerojet Academy" width={140} height={35} className="object-contain" />
            )}
          </Link>
        </div>
        
        {/* User Profile */}
        <div className={`py-6 flex flex-col items-center justify-center shrink-0 transition-all duration-300 ${collapsed ? 'px-2' : 'px-4'}`}>
          {user.image && (
            <Image 
              src={user.image} 
              alt="Profile" 
              width={collapsed ? 40 : 64} 
              height={collapsed ? 40 : 64} 
              className="rounded-full border-2 border-aerojet-sky shadow-sm transition-all duration-300"
            />
          )}
          {!collapsed && (
            <div className="mt-3 text-center w-full animate-in fade-in duration-300">
              <p className="font-semibold text-sm truncate w-full">{user.name}</p>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                isStudent ? 'bg-white/10 text-gray-300' : 'bg-aerojet-sky text-white'
              }`}>
                {userRole}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 mt-2 space-y-1 no-scrollbar">
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link 
                key={item.title} 
                href={item.href} 
                className={`flex items-center px-3 py-3 rounded-lg transition-all group ${
                  isActive ? "bg-aerojet-sky text-white shadow-md font-medium" : "text-gray-300 hover:bg-white/10 hover:text-white"
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.title : ''}
              >
                <item.icon />
                {!collapsed && <span className="ml-3 text-sm truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* --- STUDENT STATUS WIDGET (CONDITIONAL) --- */}
        {isStudent && !collapsed && (
          <div className="mx-4 mb-2 p-3 bg-white/10 rounded-xl border border-white/5 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className="text-[10px] text-aerojet-sky uppercase tracking-widest font-bold mb-1">
              Current Period
            </p>
            <p className="text-xs font-semibold text-white mb-3">2026/27 Academic Year</p>
            
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-300">Status</span>
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full border border-green-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                ENROLLED
              </span>
            </div>
          </div>
        )}

        {/* Sign Out */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <button 
            onClick={() => setIsSignOutModalOpen(true)} 
            className={`flex items-center w-full p-2 rounded-lg text-red-300 hover:bg-red-500/10 hover:text-red-200 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`} 
            title="Sign Out"
          >
            <Icons.SignOut />
            {!collapsed && <span className="ml-3 text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      <ConfirmationModal 
        isOpen={isSignOutModalOpen} 
        onClose={() => setIsSignOutModalOpen(false)} 
        onConfirm={handleSignOut} 
        title="Confirm Sign Out" 
        message="Are you sure you want to sign out?"
      />
    </>
  );
}
