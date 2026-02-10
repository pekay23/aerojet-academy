"use client";

import React, { useState } from 'react';
import {
  LayoutDashboard,
  CreditCard,
  BookOpen,
  UserCircle,
  Headphones,
  LogOut,
  Sun,
  Moon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useTheme } from "next-themes";
import ConfirmationModal from '@/components/modal/ConfirmationModal';
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
  const { setTheme, theme } = useTheme();
  const [isSignOutModalOpen, setIsSignOutModalOpen] = useState(false);

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-border bg-background static h-full w-62.5 data-[collapsed=true]:w-20 transition-all duration-300 z-30 flex flex-col">
        <SidebarHeader className="h-16.25 flex items-center justify-center border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden group-data-[collapsible=icon]:justify-center w-full">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground shadow-lg shrink-0">
              A
            </div>
            <span className="font-bold tracking-tight text-foreground group-data-[collapsible=icon]:hidden">Applicant Portal</span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel className="text-muted-foreground">Menu</SidebarGroupLabel>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.url)}
                    tooltip={item.title}
                    className="text-foreground/80 hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
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
            <SidebarGroupLabel className="text-muted-foreground">Account</SidebarGroupLabel>
            <SidebarMenu>
              {accountMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith(item.url)}
                    tooltip={item.title}
                    className="text-foreground/80 hover:bg-accent hover:text-accent-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
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

        <SidebarFooter className="border-t border-border p-4">
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
              <span className="group-data-[collapsed=true]:hidden font-medium">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </span>
            </SidebarMenuButton>

            {/* Sign Out */}
            <SidebarMenuButton
              onClick={() => setIsSignOutModalOpen(true)}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive w-full justify-start group-data-[collapsed=true]:justify-center"
              tooltip="Sign Out"
            >
              <LogOut className="w-5 h-5" />
              <span className="group-data-[collapsed=true]:hidden font-medium">Sign Out</span>
            </SidebarMenuButton>
          </div>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
      <ConfirmationModal isOpen={isSignOutModalOpen} onClose={() => setIsSignOutModalOpen(false)} onConfirm={() => signOut({ callbackUrl: '/' })} title="Sign Out" message="Exit applicant portal?" />
    </>
  );
}
