"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from "next-auth/react";
import { User } from 'next-auth';
import { toast } from 'sonner';
import { useState } from 'react';
import ConfirmationModal from '@/components/modal/ConfirmationModal';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Power } from 'lucide-react';

// --- Icons ---
const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
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
  
  // Staff Icons (For fallback if needed)
  Applications: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
};

// --- Menu Data Definitions ---
const studentMenu = [
  { title: "Dashboard", href: "/portal/dashboard", icon: Icons.Dashboard },
  { title: "My Courses", href: "/portal/courses", icon: Icons.Courses },
  { title: "Exam Bookings", href: "/portal/exams", icon: Icons.Exams },
  { title: "Exam Pools", href: "/portal/exam-pools", icon: Icons.Users }, // Added Pools Link
  { title: "Results", href: "/portal/results", icon: Icons.Results },
  { title: "Finance & Ledger", href: "/portal/finance", icon: Icons.Finance },
  { title: "Exam Wallet", href: "/portal/wallet", icon: Icons.Wallet },
  { title: "Support", href: "/portal/support", icon: Icons.Support },
  { title: "My Profile", href: "/portal/profile", icon: Icons.Profile },
];

const staffMenu = [
  { title: "Dashboard", href: "/staff/dashboard", icon: Icons.Dashboard },
  { title: "Applications", href: "/staff/applications", icon: Icons.Applications },
  { title: "Courses", href: "/staff/courses", icon: Icons.Courses },
  { title: "Exam Management", href: "/staff/exams", icon: Icons.Exams },
  { title: "Results Entry", href: "/staff/results", icon: Icons.Results },
  { title: "Finance Verify", href: "/staff/finance", icon: Icons.Finance },
  { title: "User Directory", href: "/staff/users", icon: Icons.Users },
  { title: "Support Inbox", href: "/staff/support", icon: Icons.Support },
  { title: "Settings", href: "/staff/settings", icon: Icons.Profile },
];

export default function PortalSidebar({ 
  user, 
  collapsed = false, 
  setCollapsed 
}: { 
  user: User & { role?: string; enrollmentStatus?: string }; 
  collapsed?: boolean; 
  setCollapsed?: (val: boolean) => void;
}) {
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const pathname = usePathname();

  const userRole = (user?.role || 'STUDENT').toUpperCase();
  const isStudent = userRole === 'STUDENT';
  const enrollmentStatus = (user as any).enrollmentStatus || 'PROSPECT';
  
  // Decide which menu to show
  const items = ['ADMIN', 'STAFF', 'INSTRUCTOR'].includes(userRole) ? staffMenu : studentMenu;

  const handleSignOut = () => {
    toast.promise(signOut({ callbackUrl: '/portal/login' }), {
      loading: 'Signing out...', success: 'Signed out.', error: 'Failed.'
    });
  };

  return (
    <>
      <aside className={`bg-card border-r border-border flex flex-col h-full shadow-xl transition-all duration-300 relative ${collapsed ? 'w-20' : 'w-64'}`}>
        
        {/* Toggle Button */}
        {setCollapsed && (
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex absolute -right-3 top-20 bg-card text-muted-foreground p-1.5 rounded-full shadow-md z-50 border border-border hover:text-primary transition-colors">
            {collapsed ? <Icons.Expand /> : <Icons.Collapse />}
          </button>
        )}

        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-border mx-4 shrink-0">
          <Link href="/">
            {collapsed ? (
              <Image src="/apple-touch-icon.png" alt="AA" width={32} height={32} className="object-contain rounded-md" />
            ) : (
              <>
                <Image src="/AATA_logo_hor_onWhite.png" alt="Aerojet Academy" width={140} height={35} className="object-contain block dark:hidden" />
                <Image src="/ATA_logo_hor_onDark.png" alt="Aerojet Academy" width={140} height={35} className="object-contain hidden dark:block" />
              </>
            )}
          </Link>
        </div>
        
        {/* User Profile */}
        <div className={`py-6 flex flex-col items-center justify-center shrink-0 transition-all duration-300 ${collapsed ? 'px-2' : 'px-4'}`}>
          <div className={`rounded-full bg-muted flex items-center justify-center font-bold text-foreground transition-all mx-auto overflow-hidden relative ${collapsed ? 'w-10 h-10 text-sm' : 'w-16 h-16 text-xl shadow-sm border border-border'}`}>
            {user.image ? <Image src={user.image} alt="User" fill className="object-cover" /> : <span>{user.name?.[0]}</span>}
          </div>
          {!collapsed && (
            <div className="mt-3 text-center w-full animate-in fade-in duration-300">
              <p className="font-bold text-sm truncate w-full text-foreground">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate w-full mt-0.5">{user.email}</p>
              <div className="mt-2">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${isStudent ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                  {userRole}
                </span>
              </div>
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
                  isActive ? "bg-primary text-primary-foreground shadow-md font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                } ${collapsed ? 'justify-center' : ''}`}
                title={collapsed ? item.title : ''}
              >
                <item.icon />
                {!collapsed && <span className="ml-3 text-sm truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* --- STUDENT STATUS WIDGET --- */}
        {isStudent && !collapsed && (
          <div className="mx-4 mb-2 p-3 bg-muted/50 rounded-xl border border-border animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">
              Current Period
            </p>
            <p className="text-xs font-bold text-foreground mb-3">2026/27 Academic Year</p>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Status</span>
              <span className={`flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${enrollmentStatus === 'ENROLLED' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${enrollmentStatus === 'ENROLLED' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></span>
                {enrollmentStatus}
              </span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-border shrink-0 flex flex-col gap-2">
          <div className={`flex items-center ${collapsed ? 'flex-col gap-4' : 'justify-between bg-muted/30 p-2 rounded-2xl'}`}>
            <div className={`${collapsed ? '' : 'bg-card rounded-xl shadow-sm'}`}>
              <ThemeToggle />
            </div>
            <button
              onClick={() => setIsSignOutModalOpen(true)}
              className={`relative group flex items-center justify-center transition-all duration-300 ${
                collapsed 
                  ? 'w-10 h-10 text-destructive hover:bg-destructive/10 rounded-xl' 
                  : 'bg-destructive/10 hover:bg-destructive text-destructive hover:text-white px-4 py-2.5 rounded-xl gap-2 overflow-hidden shadow-sm hover:shadow-md'
              }`}
              title="Sign Out"
            >
              {!collapsed && (
                <span className="relative z-10 text-[10px] font-black uppercase tracking-widest">Sign Out</span>
              )}
              <Power className={`w-5 h-5 relative z-10 ${!collapsed && 'group-hover:animate-pulse'}`} />
              {!collapsed && (
                <div className="absolute inset-0 bg-destructive transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ease-out" />
              )}
            </button>
          </div>
        </div>
      </aside>

      <ConfirmationModal isOpen={isSignOutModalOpen} onClose={() => setIsSignOutModalOpen(false)} onConfirm={handleSignOut} title="Sign Out" message="Exit management portal?"/>
    </>
  );
}
