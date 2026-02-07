"use client";

import React from 'react';
import { Bell, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

interface PortalHeaderProps {
  onMenuClick?: () => void; // Made optional
  title?: string;           // Added title prop
  isEnrolled?: boolean;     // Kept for backward compatibility if needed
}

export default function PortalHeader({ onMenuClick, title, isEnrolled }: PortalHeaderProps) {
  const { data: session } = useSession();
  const user = session?.user as any;

  // Determine display title
  const displayTitle = title || (isEnrolled ? 'Student Portal' : 'Applicant Portal');

  return (
    <header className="flex items-center justify-between h-full w-full">
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button is now handled by SidebarTrigger in the Layout */}
        <h1 className="text-lg font-bold text-foreground">
          {displayTitle}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
            <UserCircle className="w-7 h-7 text-muted-foreground" />
            <div className='hidden sm:flex flex-col items-end'>
                <span className='text-sm font-medium leading-none'>{user?.name}</span>
                <span className='text-xs text-muted-foreground'>{user?.email}</span>
            </div>
        </div>
      </div>
    </header>
  );
}
