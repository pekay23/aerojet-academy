"use client";


import React from 'react';
import { Sun, Moon, ChevronRight, LogOut, User } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useTheme } from "next-themes";
import { useRouter, usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NotificationBell from './NotificationBell';

export default function PortalHeader() {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();

  const user = session?.user as { name?: string | null; email?: string | null; image?: string | null } | undefined;
  const firstName = user?.name?.split(' ')[0] || 'User';

  // Generate breadcrumbs from pathname
  const pathSegments = pathname?.split('/').filter(Boolean) || [];
  // e.g. ['applicant', 'payment'] -> Applicant > Payment

  return (
    <header className="flex items-center justify-between h-16 w-full bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 px-6 border-b border-border/40 sticky top-0 z-50 transition-all">
      
      {/* LEFT: Breadcrumbs / Title */}
      <div className="flex flex-col justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
             <span className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer" onClick={() => router.push('/applicant/dashboard')}>Portal</span>
             {pathSegments.map((segment, index) => (
                 <React.Fragment key={segment}>
                     <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                     <span className={`capitalize ${index === pathSegments.length - 1 ? 'text-foreground font-semibold' : 'opacity-50 hover:opacity-100 transition-opacity cursor-pointer'}`}>
                         {segment.replace(/-/g, ' ')}
                     </span>
                 </React.Fragment>
             ))}
        </div>
      </div>

      {/* RIGHT: Actions */}
      <div className="flex items-center gap-1 sm:gap-2">

        <div className="flex items-center gap-1 mr-2">
            <NotificationBell />
            
            <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full hover:bg-accent text-muted-foreground transition-colors"
            >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
        </div>

        <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>

        {/* User Profile */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 pl-1 outline-none group">
              <div className="text-right hidden md:block">
                <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {firstName}
                </div>
              </div>
              <Avatar className="h-8 w-8 ring-2 ring-transparent group-hover:ring-primary/20 transition-all">
                  <AvatarImage src={user?.image || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                      {user?.name?.[0] || 'U'}
                  </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 mt-2">
            <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/applicant/profile')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}
