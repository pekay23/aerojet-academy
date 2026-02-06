"use client";

import { useSession } from "next-auth/react";
import { ThemeToggle } from "@/components/ThemeToggle";

type PortalHeaderProps = {
  onMenuClick: () => void;
};

export default function PortalHeader({ onMenuClick }: PortalHeaderProps) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  let title = "Student Portal";
  if (role === 'ADMIN') title = "Admin Console";
  else if (role === 'STAFF') title = "Staff Portal";
  else if (role === 'INSTRUCTOR') title = "Instructor Portal";

  return (
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-card/80 backdrop-blur-md p-4 shadow-sm border-b border-slate-200 dark:border-white/5 flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center">
        <button 
          onClick={onMenuClick} 
          className="p-2 mr-2 lg:hidden text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 rounded-md transition-colors"
        >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
        </button>
        <h1 className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">
          {title}
        </h1>
      </div>
      
      {/* Mobile Theme Toggle (Desktop is in Sidebar) */}
      <div className="lg:hidden">
        <ThemeToggle />
      </div>
    </header>
  );
}
