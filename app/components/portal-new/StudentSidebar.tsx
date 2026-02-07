"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { signOut } from "next-auth/react";
import { toast } from 'sonner';
import { LayoutDashboard, BookOpen, GraduationCap, Users, BarChart, CreditCard, Wallet, LifeBuoy, UserCircle, LogOut } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import ConfirmationModal from '@/components/modal/ConfirmationModal';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarGroup, useSidebar } from '@/components/ui/sidebar';

const studentMenu = [
  { title: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { title: "My Courses", href: "/student/courses", icon: BookOpen },
  { title: "Exam Bookings", href: "/student/exams", icon: GraduationCap },
  { title: "Exam Pools", href: "/student/exam-pools", icon: Users },
  { title: "Results", href: "/student/results", icon: BarChart },
  { title: "Finance", href: "/student/finance", icon: CreditCard },
  { title: "Wallet", href: "/student/wallet", icon: Wallet },
  { title: "Support", href: "/student/support", icon: LifeBuoy },
  { title: "My Profile", href: "/student/profile", icon: UserCircle },
];

export default function StudentSidebar({ user }: { user: any }) {
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);
  const pathname = usePathname();
  const { open } = useSidebar();
  const enrollmentStatus = user.enrollmentStatus || 'PROSPECT';

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-white/10 bg-aerojet-blue! text-white">
        <SidebarHeader className="h-20 flex items-center justify-center border-b border-white/10 mb-2">
           <Link href="/" className="flex items-center justify-center w-full h-full p-2">
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
                <div className="relative h-16 w-16 rounded-full overflow-hidden border border-white/10 shadow-sm group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 transition-all">
                    {user.image ? <Image src={user.image} alt="User" fill className="object-cover" /> : <div className="h-full w-full bg-white/10 flex items-center justify-center font-bold text-white">{user.name?.[0]}</div>}
                </div>
                <div className="mt-3 text-center w-full group-data-[collapsible=icon]:hidden animate-in fade-in">
                    <p className="font-bold text-sm truncate text-white">{user.name}</p>
                    <p className="text-[10px] text-blue-200 truncate">{user.email}</p>
                    <span className="text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest bg-blue-500/20 text-blue-100 border border-blue-500/30 mt-2 inline-block">STUDENT</span>
                </div>
            </div>

            <SidebarGroup>
                <SidebarMenu>
                    {studentMenu.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton 
                                asChild 
                                isActive={pathname.startsWith(item.href)} 
                                tooltip={item.title} 
                                className="h-10 text-blue-100 hover:bg-white/10 hover:text-white data-[active=true]:bg-aerojet-sky data-[active=true]:text-white"
                            >
                                <Link href={item.href}><item.icon /><span>{item.title}</span></Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarGroup>

            <div className="group-data-[collapsible=icon]:hidden px-4 mt-auto mb-4">
                 <div className="p-3 bg-black/20 rounded-xl border border-white/10">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-1">Current Period</p>
                    <p className="text-xs font-bold text-white mb-3">2026/27 Academic Year</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-blue-300">Status</span>
                      <span className={`flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded-full border uppercase ${enrollmentStatus === 'ENROLLED' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${enrollmentStatus === 'ENROLLED' ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`}></span>
                        {enrollmentStatus}
                      </span>
                    </div>
                  </div>
            </div>
        </SidebarContent>

        <SidebarFooter className="border-t border-white/10 p-4">
            <div className="flex flex-col gap-2 group-data-[collapsible=icon]:items-center">
                <div className="group-data-[collapsible=icon]:hidden"><ThemeToggle /></div>
                <SidebarMenuButton onClick={() => setIsSignOutModalOpen(true)} className="text-red-300 hover:bg-red-500/20 hover:text-red-200 w-full justify-start group-data-[collapsible=icon]:justify-center" tooltip="Sign Out">
                    <LogOut className="w-5 h-5" /><span className="group-data-[collapsible=icon]:hidden font-medium">Sign Out</span>
                </SidebarMenuButton>
            </div>
        </SidebarFooter>
      </Sidebar>
      <ConfirmationModal isOpen={isSignOutModalOpen} onClose={() => setIsSignOutModalOpen(false)} onConfirm={() => signOut({ callbackUrl: '/login' })} title="Sign Out" message="Exit student portal?"/>
    </>
  );
}
