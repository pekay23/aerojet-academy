"use client";
import { useSession } from "next-auth/react";

type PortalHeaderProps = {
  onMenuClick: () => void;
};

export default function PortalHeader({ onMenuClick }: PortalHeaderProps) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  // Determine title based on role
  let title = "Student Portal";
  if (role === 'ADMIN') title = "Admin Console";
  else if (role === 'STAFF') title = "Staff Portal";
  else if (role === 'INSTRUCTOR') title = "Instructor Portal";

  return (
    <header className={`p-4 shadow-md flex items-center ${role === 'ADMIN' ? 'bg-slate-900 text-white' : 'bg-aerojet-blue text-white'}`}>
      <button onClick={onMenuClick} className="p-1">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </button>
      <h1 className="ml-4 font-semibold text-lg">{title}</h1>
    </header>
  );
}
