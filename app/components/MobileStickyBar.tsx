"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // 1. Import this

export default function MobileStickyBar() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname(); // 2. Get current path

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 3. Logic: Hide if inside any Portal or Auth page
  const isPortal = pathname.startsWith('/student') || 
                   pathname.startsWith('/applicant') || 
                   pathname.startsWith('/staff') ||
                   pathname.startsWith('/staff-new') ||
                   pathname.startsWith('/login') ||
                   pathname.startsWith('/register');

  if (isPortal || !isVisible) return null; // 4. Return null to hide

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-full duration-300">
      <div className="flex gap-3">
        <Link href="/courses" className="flex-1 bg-gray-100 text-gray-800 font-bold py-3 rounded-lg text-center text-sm">
          Courses
        </Link>
        <Link href="/admissions/how-to-apply" className="flex-1 bg-aerojet-blue text-white font-bold py-3 rounded-lg text-center text-sm shadow-md">
          Apply Now
        </Link>
      </div>
    </div>
  );
}
