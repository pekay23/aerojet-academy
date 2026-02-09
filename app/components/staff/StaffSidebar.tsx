"use client";

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from "next-auth/react";
import { toast } from 'sonner';
import { useState } from 'react';
import ConfirmationModal from '@/components/modal/ConfirmationModal';
import { ThemeToggle } from '@/app/components/marketing/ThemeToggle';
import { Power } from 'lucide-react';

const Icons = {
  Dashboard: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  Applications: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Courses: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>,
  Exams: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  Results: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Finance: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Students: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.083 0 01.665-6.479L12 14z" /></svg>,
  Users: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  Communication: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>,
  SignOut: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>,
  Collapse: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>,
  Expand: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>,
};

// --- Menu Data ---
const allMenuItems = [
  { title: "Dashboard", href: "/staff/dashboard", icon: Icons.Dashboard, roles: ['ADMIN', 'STAFF', 'INSTRUCTOR'] },
  { title: "Admissions", href: "/staff/admissions", icon: Icons.Applications, roles: ['ADMIN', 'STAFF'] },
  { title: "Directory", href: "/staff/users", icon: Icons.Users, roles: ['ADMIN', 'STAFF'] }, // Merged Students/Users
  { title: "Finance", href: "/staff/finance", icon: Icons.Finance, roles: ['ADMIN', 'STAFF'] },
  { title: "Courses", href: "/staff/courses", icon: Icons.Courses, roles: ['ADMIN', 'STAFF'] },
  { title: "Exams", href: "/staff/exams", icon: Icons.Exams, roles: ['ADMIN', 'STAFF'] },
  { title: "Communication", href: "/staff/communication", icon: Icons.Communication, roles: ['ADMIN', 'STAFF'] },
  
  // Instructor-Specific
  { title: "My Classes", href: "/staff/materials", icon: Icons.Courses, roles: ['INSTRUCTOR'] }, 
  { title: "Attendance", href: "/staff/attendance", icon: Icons.Students, roles: ['INSTRUCTOR'] }, 
  { title: "Grading", href: "/staff/results", icon: Icons.Results, roles: ['INSTRUCTOR'] }, 

  // Admin Only
  { title: "System Settings", href: "/staff/settings", icon: Icons.Settings, roles: ['ADMIN'] },
];

export default function StaffSidebar({ user, collapsed = false, setCollapsed }: { user: any, collapsed?: boolean, setCollapsed?: (v: boolean) => void }) {
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const pathname = usePathname();

  const userRole = (user?.role || 'STUDENT').toUpperCase();
  const visibleItems = allMenuItems.filter(item => item.roles && item.roles.includes(userRole));

  const handleSignOut = () => {
    toast.promise(signOut({ callbackUrl: '/portal/login' }), {
      loading: 'Signing out...', success: 'Signed out.', error: 'Failed.'
    });
  };

  return (
    <>
      <aside className={`bg-card border-r border-border flex flex-col h-full shadow-xl transition-all duration-300 relative ${collapsed ? 'w-20' : 'w-64'}`}>
        
        {/* Toggle Button for Desktop */}
        {setCollapsed && (
          <button onClick={() => setCollapsed(!collapsed)} className="hidden lg:flex absolute -right-3 top-20 bg-card text-muted-foreground p-1.5 rounded-full shadow-md z-50 border border-border hover:text-primary transition-colors">
            {collapsed ? <Icons.Expand /> : <Icons.Collapse />}
          </button>
        )}

        <div className="h-16 flex items-center justify-center border-b border-border mx-4 shrink-0">
  <Link href="/staff/dashboard">
    {collapsed ? (
      // 1. COLLAPSED MODE: Use the Icon
      <Image 
        src="/apple-touch-icon.png" 
        alt="AA" 
        width={32} 
        height={32} 
        className="object-contain rounded-md" 
      />
    ) : (
      // 2. EXPANDED MODE: Conditional Logo based on Theme
      <>
        {/* Logo for LIGHT mode */}
        <Image 
          src="/AATA_logo_hor_onWhite.png" 
          alt="Aerojet Academy" 
          width={140} 
          height={35} 
          className="object-contain block dark:hidden" 
        />
        {/* Logo for DARK mode */}
        <Image 
          src="/ATA_logo_hor_onDark.png" 
          alt="Aerojet Academy" 
          width={140} 
          height={35} 
          className="object-contain hidden dark:block" 
        />
      </>
    )}
  </Link>
</div>

        
        {/* --- User Profile Section --- */}
<div className={`py-6 flex flex-col items-center justify-center shrink-0 transition-all duration-300 ${collapsed ? 'px-2' : 'px-4'}`}>
  
  {/* Avatar Wrapper */}
  <div className={`rounded-full bg-muted flex items-center justify-center font-bold text-foreground transition-all mx-auto overflow-hidden relative ${collapsed ? 'w-10 h-10 text-sm' : 'w-16 h-16 text-xl shadow-sm border border-border'}`}>
    {user.image ? (
      <Image src={user.image} alt="User" fill className="object-cover" />
    ) : (
      <span>{user.name?.[0]}</span>
    )}
  </div>

  {/* Text Info - Visible only when sidebar is expanded */}
  {!collapsed && (
    <div className="mt-3 text-center w-full animate-in fade-in duration-300 overflow-hidden">
      <p className="font-bold text-sm truncate w-full text-foreground">
        {user.name}
      </p>
      
      {/* --- ADDED EMAIL HERE --- */}
      <p className="text-[10px] text-muted-foreground truncate w-full mt-0.5">
        {user.email}
      </p>

      {/* Role Badge */}
      <div className="mt-2">
        <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
          userRole === 'ADMIN' 
            ? 'bg-destructive/10 text-destructive border border-destructive/20' 
            : 'bg-primary/10 text-primary border border-primary/20'
        }`}>
          {userRole}
        </span>
      </div>
    </div>
  )}
</div>


        {/* Navigation area */}
        <nav className="flex-1 overflow-y-auto px-3 mt-2 space-y-1 no-scrollbar min-h-0">
          {visibleItems.length > 0 ? visibleItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link key={item.title} href={item.href} className={`flex items-center px-3 py-3 rounded-lg transition-all group ${isActive ? "bg-primary text-primary-foreground shadow-md font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"} ${collapsed ? 'justify-center' : ''}`} title={collapsed ? item.title : ''}>
                <item.icon />
                {!collapsed && <span className="ml-3 text-sm truncate">{item.title}</span>}
              </Link>
            );
          }) : (
            <p className="text-[10px] text-muted-foreground text-center p-4">No access authorized for role: {userRole}</p>
          )}
        </nav>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border shrink-0 flex flex-col gap-2">
          {!collapsed && (
             <div className="flex justify-center mb-2">
                <ThemeToggle />
             </div>
          )}
          <button onClick={() => setIsSignOutModalOpen(true)} className={`flex items-center w-full p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors ${collapsed ? 'justify-center' : ''}`} title="Sign Out">
            <Icons.SignOut />
            {!collapsed && <span className="ml-3 text-sm font-medium">Sign Out</span>}
          </button>
        </div>
      </aside>

      <ConfirmationModal isOpen={isSignOutModalOpen} onClose={() => setIsSignOutModalOpen(false)} onConfirm={handleSignOut} title="Sign Out" message="Exit management portal?"/>
    </>
  );
}

