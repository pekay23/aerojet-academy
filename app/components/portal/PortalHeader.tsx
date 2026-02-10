"use client";

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Calendar as CalendarIcon, Clock, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession, signOut } from 'next-auth/react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useTheme } from "next-themes";
import { useRouter } from 'next/navigation';

interface PortalHeaderProps {
  onMenuClick?: () => void;
  title?: string;
  isEnrolled?: boolean;
}

import NotificationBell from './NotificationBell';

export default function PortalHeader({ onMenuClick, title, isEnrolled }: PortalHeaderProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { setTheme, theme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const user = session?.user as any;
  const firstName = user?.name?.split(' ')[0] || 'User';
  const roleLabel = user?.role === 'ADMIN' ? 'Administrator' : (user?.role === 'STAFF' ? 'Staff Member' : `Student ID: ${user?.studentProfile?.studentId || 'PENDING'}`);

  return (
    <header className="flex items-center justify-between h-full w-full bg-white dark:bg-[#0f172a] px-2 transition-colors duration-300">

      {/* LEFT: Welcome & Time */}
      <div className="flex flex-col justify-center">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white leading-tight">
          Welcome, {firstName}
        </h1>
        <div className="flex items-center gap-3 text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
          <div className="flex items-center gap-1">
            <CalendarIcon className="w-3 h-3" />
            {currentTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
          </div>
          <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-3">
            <Clock className="w-3 h-3" />
            {currentTime.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>

      {/* RIGHT: Actions & Profile */}
      <div className="flex items-center gap-4">

        <NotificationBell />

        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700 outline-none group">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-aerojet-blue dark:group-hover:text-blue-400 transition-colors">
                  {user?.name}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400">{roleLabel}</div>
              </div>
              <div className="w-9 h-9 bg-aerojet-blue text-white rounded-full flex items-center justify-center font-bold text-sm shadow-md ring-2 ring-white dark:ring-gray-800">
                {user?.name?.[0] || 'U'}
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push(user?.role === 'STUDENT' ? '/student/profile' : '/staff/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })} className="text-red-600 focus:text-red-600">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </div>
    </header>
  );
}
