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
  Settings, LogOut, FileBarChart
} from 'lucide-react';
import { ThemeToggle } from '@/app/components/marketing/ThemeToggle';
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
  const userRole = (user?.role || 'STUDENT').toUpperCase();
  const visibleItems = allMenuItems.filter(item => item.roles && item.roles.includes(userRole));

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-border bg-card z-30">
        <SidebarHeader className="h-20 flex items-center justify-center border-b border-border mb-2">
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

        <SidebarContent>
            <div className="flex flex-col items-center justify-center py-6 px-2">
                <div className="relative h-16 w-16 rounded-full overflow-hidden border border-border shadow-sm group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 transition-all">
                    {user.image ? <Image src={user.image} alt="User" fill className="object-cover" /> : <div className="h-full w-full bg-muted flex items-center justify-center font-bold">{user.name?.[0]}</div>}
                </div>
                <div className="mt-3 text-center w-full group-data-[collapsible=icon]:hidden animate-in fade-in">
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

        <SidebarFooter className="border-t border-border p-4">
            <div className="flex flex-col gap-2 group-data-[collapsible=icon]:items-center">
                <div className="group-data-[collapsible=icon]:hidden"><ThemeToggle /></div>
                <SidebarMenuButton onClick={() => setIsSignOutModalOpen(true)} className="text-destructive hover:bg-destructive/10 w-full justify-start group-data-[collapsible=icon]:justify-center" tooltip="Sign Out">
                    <LogOut className="w-5 h-5" /><span className="group-data-[collapsible=icon]:hidden font-medium">Sign Out</span>
                </SidebarMenuButton>
            </div>
        </SidebarFooter>
      </Sidebar>
      <ConfirmationModal isOpen={isSignOutModalOpen} onClose={() => setIsSignOutModalOpen(false)} onConfirm={() => signOut({ callbackUrl: '/login' })} title="Sign Out" message="Exit management portal?"/>
    </>
  );
}
