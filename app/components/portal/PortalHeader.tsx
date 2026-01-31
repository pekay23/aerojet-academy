"use client";

type PortalHeaderProps = {
  onMenuClick: () => void;
};

export default function PortalHeader({ onMenuClick }: PortalHeaderProps) {
  return (
    <header className="lg:hidden bg-aerojet-blue text-white p-4 shadow-md flex items-center">
      <button onClick={onMenuClick} className="p-1">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"></path></svg>
      </button>
      <h1 className="ml-4 font-semibold">Student Portal</h1>
    </header>
  );
}
