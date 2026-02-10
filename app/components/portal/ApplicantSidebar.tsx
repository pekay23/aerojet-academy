"use client";

import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  BookOpen, 
  UserCircle, 
  Headphones, 
  LogOut,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
// Ensure this path points to where Shadcn installed the component. 
// If it fails, try '@/app/components/ui/sidebar'
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarRail,
} from '@/components/ui/sidebar'; 

const mainMenuItems = [
  { title: "Onboarding", url: "/portal/applicant", icon: LayoutDashboard },
  { title: "Finance", url: "/portal/finance", icon: CreditCard },
  { title: "Exam Bookings", url: "/portal/exam-pools", icon: BookOpen },
];

const accountMenuItems = [
  { title: "My Profile", url: "/portal/profile", icon: UserCircle },
  { title: "Support", url: "/portal/support", icon: Headphones },
];

// CHANGED TO DEFAULT EXPORT 👇
export default function ApplicantSidebar({ user }: { user: any }) {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon" className="border-r border-border bg-white dark:bg-[#0f172a] dark:border-transparent static h-full w-62.5 data-[collapsed=true]:w-20 transition-all duration-300 z-30 flex flex-col">
      <SidebarHeader className="h-16.25 flex items-center justify-center border-b border-white/10">
        <div className="flex items-center gap-3 overflow-hidden group-data-[collapsible=icon]:justify-center w-full">
            <div className="w-8 h-8 bg-aerojet-sky rounded-lg flex items-center justify-center font-bold text-white shadow-lg shrink-0">
                A
            </div>
            <span className="font-bold tracking-tight group-data-[collapsible=icon]:hidden">Applicant Portal</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-200/50">Menu</SidebarGroupLabel>
          <SidebarMenu>
            {mainMenuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname.startsWith(item.url)}
                  tooltip={item.title}
                  className="hover:bg-white/10 data-[active=true]:bg-aerojet-sky data-[active=true]:text-white text-blue-100"
                >
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel className="text-blue-200/50">Account</SidebarGroupLabel>
          <SidebarMenu>
            {accountMenuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton 
                  asChild 
                  isActive={pathname.startsWith(item.url)}
                  tooltip={item.title}
                  className="hover:bg-white/10 data-[active=true]:bg-aerojet-sky data-[active=true]:text-white text-blue-100"
                >
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-white/10 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-red-300 hover:bg-red-500/20 hover:text-red-200"
              tooltip="Sign Out"
            >
              <LogOut />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
