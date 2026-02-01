"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileStickyBar() {
  const pathname = usePathname();

  // List of paths where the sticky bar should be HIDDEN
  const hiddenPaths = ["/portal", "/staff", "/register", "/contact", "/studio"];

  // Check if the current path starts with any of the hidden paths
  const shouldHide = hiddenPaths.some((path) => pathname.startsWith(path));

  if (shouldHide) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 p-4 z-40 md:hidden flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
      <Link 
        href="/contact" 
        className="flex-1 border-2 border-aerojet-blue text-aerojet-blue font-bold py-3 rounded text-center text-sm uppercase tracking-wide"
      >
        Enquire
      </Link>
      <Link 
        href="/register" 
        className="flex-1 bg-aerojet-sky text-white font-bold py-3 rounded text-center text-sm uppercase tracking-wide shadow-md"
      >
        Apply Now
      </Link>
    </div>
  );
}
