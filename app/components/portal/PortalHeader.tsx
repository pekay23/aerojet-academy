"use client";

import React from 'react';
import { Menu, Bell, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';

// --- NEW: Define props to accept isEnrolled ---
interface PortalHeaderProps {
  onMenuClick: () => void;
  isEnrolled: boolean;
}

export default function PortalHeader({ onMenuClick, isEnrolled }: PortalHeaderProps) {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <header className="flex items-center justify-between h-16.25 px-4 border-b bg-card">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onMenuClick} className="lg:hidden">
          <Menu className="w-6 h-6" />
        </Button>
        
        {/* --- DYNAMIC TITLE --- */}
        <h1 className="text-lg font-bold text-foreground">
          {isEnrolled ? 'Student Portal' : 'Applicant Portal'}
        </h1>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
            <UserCircle className="w-7 h-7 text-muted-foreground" />
            <div className='hidden sm:flex flex-col'>
                <span className='text-sm font-medium'>{user?.name}</span>
                <span className='text-xs text-muted-foreground'>{user?.email}</span>
            </div>
        </div>
      </div>
    </header>
  );
}
