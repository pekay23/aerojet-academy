"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from "next-auth/react";
import { toast } from 'sonner';
import { 
  LayoutDashboard, ClipboardList, Users, CreditCard, 
  BookOpen, GraduationCap, MessageSquare, BarChart, 
  Settings, LogOut, FileBarChart, Sun, Moon
} from 'lucide-react';
import { useTheme } from "next-themes";
import ConfirmationModal from '@/components/modal/ConfirmationModal';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup,
  useSidebar,
} from '@/components/ui/sidebar';

const allMenuItems = [
  { title: "Dashboard", href: "/staff/dashboard", icon: LayoutDashboard, roles: ['ADMIN', 'STAFF', 'INSTRUCTOR'] },
  { title: "Admissions", href: "/staff/admissions", icon: ClipboardList, roles: ['ADMIN', 'STAFF'] },
  { title: "Students", href: "/staff/students", icon: Users, roles: ['ADMIN', 'STAFF', 'INSTRUCTOR'] },
  { title: "Directory", href: "/staff/users", icon: Users, roles: ['ADMIN'] },
  { title: "Finance", href: "/staff/finance", icon: CreditCard, roles: ['ADMIN', 'STAFF'] },
  { title: "Courses", href: "/staff/courses", icon: BookOpen, roles: ['ADMIN', 'STAFF'] },
  { title: "Exams", href: "/staff/exams", icon: GraduationCap, roles: ['ADMIN', 'STAFF'] },
  { title: "Communication", href: "/staff/communication", icon: MessageSquare, roles: ['ADMIN', 'STAFF'] },
  { title: "Reports", href: "/staff/reports", icon: FileBarChart, roles: ['ADMIN', 'STAFF'] },
  { title: "My Classes", href: "/staff/materials", icon: BookOpen, roles: ['INSTRUCTOR'] }, 
  { title: "Attendance", href: "/staff/attendance", icon: Users, roles: ['INSTRUCTOR'] }, 
  { title: "Grading", href: "/staff/results", icon: BarChart, roles: ['INSTRUCTOR'] }, 
  { title: "System Settings", href: "/staff/settings", icon: Settings, roles: ['ADMIN'] },
];

export default function StaffSidebar({ user }: { user: any }) {
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const pathname = usePathname();
  const { open } = useSidebar();
  const { setTheme, theme } = useTheme(); 
  const userRole = (user?.role || 'STUDENT').toUpperCase();
  const visibleItems = allMenuItems.filter(item => item.roles && item.roles.includes(userRole));

  return (
    <>
      <Sidebar 
        collapsible="icon" 
        className="border-r border-border bg-white dark:bg-[#0f172a] dark:border-transparent static h-full w-62.5 data-[collapsed=true]:w-20 transition-all duration-300 z-30 flex flex-col"
      >
        <SidebarHeader className="h-20 flex items-center justify-center border-b border-border mb-2 shrink-0">
          <Link href="/staff/dashboard" className="flex items-center justify-center w-full h-full p-2">
            {open ? (
               <>
                <Image src="/AATA_logo_hor_onWhite.png" alt="Aerojet Academy" width={140} height={35} className="object-contain block dark:hidden" />
                <Image src="/ATA_logo_hor_onDark.png" alt="Aerojet Academy" width={140} height={35} className="object-contain hidden dark:block" />
               </>
            ) : (
                <Image src="/apple-touch-icon.png" alt="AA" width={32} height={32} className="object-contain rounded-md" />
            )}
          </Link>
        </SidebarHeader>

        <SidebarContent className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="flex flex-col items-center justify-center py-6 px-2">
                <div className="relative h-16 w-16 rounded-full overflow-hidden border border-border shadow-sm group-data-[collapsed=true]:h-8 group-data-[collapsed=true]:w-8 transition-all">
                    {user.image ? <Image src={user.image} alt="User" fill className="object-cover" /> : <div className="h-full w-full bg-muted flex items-center justify-center font-bold">{user.name?.[0]}</div>}
                </div>
                <div className="mt-3 text-center w-full group-data-[collapsed=true]:hidden animate-in fade-in">
                    <p className="font-bold text-sm truncate">{user.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 mt-2 inline-block">{userRole}</span>
                </div>
            </div>
            <SidebarGroup>
                <SidebarMenu>
                    {visibleItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton 
                                asChild 
                                isActive={pathname.startsWith(item.href)} 
                                tooltip={item.title} 
                                className="h-10 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
                            >
                                <Link href={item.href}><item.icon /><span>{item.title}</span></Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border p-4 shrink-0 mt-auto">
            <div className="flex flex-col gap-2 group-data-[collapsed=true]:items-center">
                
                {/* Theme Toggle */}
                <SidebarMenuButton 
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="w-full justify-start group-data-[collapsed=true]:justify-center"
                    tooltip="Toggle Theme"
                >
                    <div className="flex items-center justify-center w-5 h-5">
                        <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </div>
                    <span className="group-data-[collapsed=true]:hidden font-medium ml-2">
                        {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                    </span>
                </SidebarMenuButton>

                {/* Sign Out */}
                <SidebarMenuButton onClick={() => setIsSignOutModalOpen(true)} className="text-destructive hover:bg-destructive/10 w-full justify-start group-data-[collapsed=true]:justify-center" tooltip="Sign Out">
                    <LogOut className="w-5 h-5" />
                    <span className="group-data-[collapsed=true]:hidden font-medium ml-2">Sign Out</span>
                </SidebarMenuButton>

            </div>
        </SidebarFooter>
      </Sidebar>
      <ConfirmationModal isOpen={isSignOutModalOpen} onClose={() => setIsSignOutModalOpen(false)} onConfirm={() => signOut({ callbackUrl: '/login' })} title="Sign Out" message="Exit management portal?"/>
    </>
  );
}
