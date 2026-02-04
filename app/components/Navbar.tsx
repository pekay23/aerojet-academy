"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; // Added to detect login state

// --- Data for navigation links ---
const navLinks = {
  courses: [
    { title: "EASA Part-66 (Full-Time)", href: "/courses/easa-full-time" },
    { title: "EASA Part-66 (Modular)", href: "/courses/easa-modular" },
    { title: "Examination-Only", href: "/courses/examination-only" },
    { title: "Revision Support", href: "/courses/revision-support" }, // Added this
    { title: "Module List (M1–M17)", href: "/courses/modules" },
    { title: "Cabin Crew (Soon)", href: "/courses/cabin-crew" },
    { title: "Pilot Training (Soon)", href: "/courses/pilot-training" },
    { title: "Exam Schedule (2026/27)", href: "/courses/exam-schedule" }
  ],
  admissions: [
    { title: "How to Apply", href: "/admissions" },
    { title: "Entry Requirements", href: "/admissions/entry-requirements" },
    { title: "Fees & Payment Milestones", href: "/admissions/fees" },
  ],
};


function MobileAccordion({ title, links, onLinkClick }: { title: string, links: { title: string, href: string }[], onLinkClick: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-gray-100 py-2">
      <button onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center w-full text-left py-2 text-aerojet-blue">
        <span className="text-xl font-bold">{title}</span>
        <span className={`text-sm transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-500px opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
        <div className="flex flex-col space-y-3 pl-4 border-l-2 border-gray-100 ml-1">
          {links.map(link => (
            <Link key={link.title} href={link.href} onClick={onLinkClick} className="block text-sm text-gray-600 hover:text-aerojet-sky font-medium py-1">
              {link.title}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Navbar({ theme = 'dark' }: { theme?: 'light' | 'dark' }) {
  // Check the environment variable
  const isPortalLive = process.env.NEXT_PUBLIC_PORTAL_LIVE === 'true';
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLightPage = theme === 'light';

  useEffect(() => {
    if (isLightPage) { setScrolled(true); return; }
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isLightPage]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : 'unset';
  }, [mobileMenuOpen]);

  const displayAsLight = scrolled || isLightPage; 
  const headerIsLight = displayAsLight || mobileMenuOpen;

  // Determine where the "Dashboard" link should go based on role
  const userRole = (session?.user as any)?.role;
  const dashboardHref = (userRole === 'ADMIN' || userRole === 'STAFF' || userRole === 'INSTRUCTOR') 
    ? '/staff/dashboard' 
    : '/portal/dashboard';

  return (
    <>
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${headerIsLight ? "bg-white/95 backdrop-blur-md shadow-sm py-3" : "bg-transparent py-4"}`}>
        <div className="w-full px-4 sm:px-6 flex justify-between items-center">
          <Link href="/" onClick={() => setMobileMenuOpen(false)} className="relative z-50">
            <Image
              src={headerIsLight ? "/AATA_logo_hor_onWhite.png" : "/ATA_logo_hor_onDark.png"}
              alt="Aerojet Academy Logo" width={160} height={40} priority className="object-contain"
            />
          </Link>

          <nav className={`hidden md:flex space-x-8 text-sm font-bold items-center transition-colors duration-300 ${displayAsLight ? "text-aerojet-blue" : "text-white"}`}>
            <div className="group relative">
                <Link href="/courses" className="hover:text-aerojet-sky transition flex items-center h-full py-2">Courses <span className="ml-1 text-xs">▼</span></Link>
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                    <div className="bg-white rounded-md shadow-lg w-64 p-2 border border-gray-100">
                        {navLinks.courses.map(link => (<Link key={link.title} href={link.href} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-aerojet-blue rounded-md">{link.title}</Link>))}
                    </div>
                </div>
            </div>
            <div className="group relative">
                <Link href="/admissions" className="hover:text-aerojet-sky transition flex items-center h-full py-2">Admissions <span className="ml-1 text-xs">▼</span></Link>
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                    <div className="bg-white rounded-md shadow-lg w-64 p-2 border border-gray-100">
                        {navLinks.admissions.map(link => (<Link key={link.title} href={link.href} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-aerojet-blue rounded-md">{link.title}</Link>))}
                    </div>
                </div>
            </div>
            <Link href="/about" className="hover:text-aerojet-sky transition">About Us</Link>
            <Link href="/news" className="hover:text-aerojet-sky transition">News</Link>
          </nav>
          
          {/* Desktop CTA - ONLY SHOW IF LIVE */}
          <div className="hidden md:flex items-center space-x-3">
            {isPortalLive ? (
              <>
                <Link 
                    href={status === 'authenticated' ? dashboardHref : '/portal/login'} 
                    className={`text-xs font-bold transition-colors ${displayAsLight ? 'text-gray-600 hover:text-aerojet-blue' : 'text-white hover:text-gray-200'}`}
                >
                  {status === 'authenticated' ? 'GO TO DASHBOARD' : 'PORTAL LOGIN'}
                </Link>
                <Link href="/register" className="bg-aerojet-sky text-white px-4 py-2 rounded-md font-bold text-xs hover:bg-aerojet-soft-blue transition shadow-lg uppercase">
                    {status === 'authenticated' ? 'Apply Now' : 'Register'}
                </Link>
              </>
            ) : (
              // Optional: Show a "Coming Soon" or "Contact Us" button instead
              <Link href="/contact" className="bg-aerojet-sky text-white px-4 py-2 rounded-md font-bold text-xs hover:bg-aerojet-soft-blue transition shadow-lg uppercase">
                Contact Us
              </Link>
            )}
          </div>

          <button className="md:hidden p-2 focus:outline-none relative z-50" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            <div className={`w-6 h-0.5 mb-1.5 transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2 bg-aerojet-blue" : (headerIsLight ? "bg-aerojet-blue" : "bg-white")}`}></div>
            <div className={`w-6 h-0.5 mb-1.5 transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : (headerIsLight ? "bg-aerojet-blue" : "bg-white")}`}></div>
            <div className={`w-6 h-0.5 transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2 bg-aerojet-blue" : (headerIsLight ? "bg-aerojet-blue" : "bg-white")}`}></div>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 bg-white z-40 pt-24 px-6 overflow-y-auto transform transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col space-y-2 pb-20">
          <MobileAccordion title="Courses" links={navLinks.courses} onLinkClick={() => setMobileMenuOpen(false)} />
          <MobileAccordion title="Admissions" links={navLinks.admissions} onLinkClick={() => setMobileMenuOpen(false)} />
          <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="block border-b border-gray-100 py-4 text-xl font-bold text-aerojet-blue">About Us</Link>
          <Link href="/news" onClick={() => setMobileMenuOpen(false)} className="block border-b border-gray-100 py-4 text-xl font-bold text-aerojet-blue">News</Link>
          <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block border-b border-gray-100 py-4 text-xl font-bold text-aerojet-blue">Contact</Link>
          
          <div className="pt-8 space-y-4">
            {isPortalLive ? (
              <>
                <Link href="/portal/login" onClick={() => setMobileMenuOpen(false)} className="block text-center text-aerojet-sky font-semibold border border-aerojet-sky py-3 rounded-md">
                  {status === 'authenticated' ? 'Go to Dashboard' : 'Student Portal Login'}
                </Link>
                <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block bg-aerojet-sky text-white text-center py-4 rounded-md shadow-md font-bold uppercase tracking-wider">
                  Start Registration
                </Link>
              </>
            ) : (
               <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block bg-aerojet-sky text-white text-center py-4 rounded-md shadow-md font-bold uppercase tracking-wider">
                  Contact Admissions
               </Link>
            )}
          </div>
        </div>
      </div>
    </>
  );
}