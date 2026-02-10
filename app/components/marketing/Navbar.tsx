"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; 
import { Wrench, Menu, X, ChevronDown } from 'lucide-react';
import { usePathname } from "next/navigation";

// ✅ UPDATED SITEMAP STRUCTURE WITH GROUPING
const navLinks = {
  // Courses are now structured with a nested group
  courses: {
    engineering: [
        { title: "EASA Part-66 B1 (Overview)", href: "/courses/easa-full-time" },
        { title: "B2 Add-On (Top-Up)", href: "/courses/cabin-crew" }, 
        { title: "Modular Programme", href: "/courses/easa-modular" },
        { title: "Examination-Only", href: "/courses/examination-only" },
        { title: "Revision Support", href: "/courses/revision-support" },
        { title: "Module Requirements", href: "/courses/modules" },
    ],
    other: [
        { title: "Cabin Crew Training (Coming Soon)", href: "#" },
        { title: "Pilot Training (Coming Soon)", href: "#" }
    ]
  },
  admissions: [
    { title: "How to Enrol", href: "/admissions/how-to-apply" },
    { title: "Entry Requirements", href: "/admissions/entry-requirements" },
    { title: "Fees & Payment Rules", href: "/admissions/fees" },
    { title: "FAQ", href: "/faq" }, 
    { title: "Application Terms", href: "/legal/terms" },
  ],
  about: [
    { title: "About Aerojet Academy", href: "/about" },
    { title: "Accra MRO Project", href: "/about/accra-mro" },
  ]
};

// ... (MobileAccordion updated to handle nested structure below) ...

function MobileAccordion({ title, links, onLinkClick }: { title: string, links: any, onLinkClick: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const isGrouped = !Array.isArray(links); // Check if it's the complex courses object

  return (
    <div className="border-b border-gray-100 py-2">
      <button onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center w-full text-left py-2 text-aerojet-blue">
        <span className="text-xl font-bold">{title}</span>
        <span className={`text-sm transform transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-125 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
        <div className="flex flex-col space-y-3 pl-4 border-l-2 border-gray-100 ml-1">
          {isGrouped ? (
            <>
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-2">Aircraft Engineering</div>
                {links.engineering.map((link: any) => (
                    <Link key={link.title} href={link.href} onClick={onLinkClick} className="block text-sm text-gray-600 hover:text-aerojet-sky font-medium py-1">{link.title}</Link>
                ))}
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4">Other Programs</div>
                {links.other.map((link: any) => (
                    <Link key={link.title} href={link.href} onClick={onLinkClick} className="block text-sm text-gray-400 font-medium py-1 cursor-default">{link.title}</Link>
                ))}
            </>
          ) : (
            links.map((link: any) => (
                <Link key={link.title} href={link.href} onClick={onLinkClick} className="block text-sm text-gray-600 hover:text-aerojet-sky font-medium py-1">{link.title}</Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function Navbar({ theme = 'dark' }: { theme?: 'light' | 'dark' }) {
  const { data: session, status } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const lightThemePaths = [
    '/admissions/fees', 
    '/legal/terms',
    '/legal/privacy',
    '/faq',
    '/register',
    '/courses/modules', 
  ];

  const isExactLight = lightThemePaths.some(path => pathname === path);
  const isDynamicLight = pathname.startsWith('/news/');
  const isForcedLight = isExactLight || isDynamicLight;
  const isLightPage = theme === 'light' || isForcedLight;

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
  
  const userRole = (session?.user as any)?.role;
  const isStaffOrAdmin = ['ADMIN', 'STAFF', 'INSTRUCTOR'].includes(userRole);
  let dashboardHref = '/student/dashboard'; 
  if (isStaffOrAdmin) dashboardHref = '/staff/dashboard';

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
            
            {/* COURSES DROPDOWN (Grouped) */}
            <div className="group relative h-full flex items-center">
                <Link href="/courses" className="hover:text-aerojet-sky transition flex items-center h-full py-2">Courses <span className="ml-1 text-xs">▼</span></Link>
                <div className="absolute top-full left-1/2 -translate-x-1/2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
                    <div className="bg-white rounded-md shadow-lg w-72 p-4 border border-gray-100 text-left">
                        
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 border-b pb-1">Aircraft Engineering</div>
                        {navLinks.courses.engineering.map(link => (
                            <Link key={link.title} href={link.href} className="block px-2 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-aerojet-blue rounded-md">{link.title}</Link>
                        ))}
                        
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-2 border-b pb-1">Other Programs</div>
                        {navLinks.courses.other.map(link => (
                            <span key={link.title} className="block px-2 py-2 text-sm text-gray-400 cursor-not-allowed">{link.title}</span>
                        ))}

                    </div>
                </div>
            </div>

            {/* ADMISSIONS DROPDOWN */}
            <div className="group relative h-full flex items-center">
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
          
          <div className="hidden md:flex items-center space-x-3">
              <>
                {isStaffOrAdmin && (
                  <Link 
                    href="/staff/dashboard" 
                    className={`flex items-center gap-1 text-xs font-bold transition-colors ${displayAsLight ? 'text-aerojet-sky hover:text-aerojet-blue' : 'text-aerojet-sky hover:text-white'}`}
                  >
                    <Wrench className="w-3 h-3" />
                    STAFF PORTAL
                  </Link>
                )}
                <Link 
                    href={status === 'authenticated' ? dashboardHref : '/login'} 
                    className={`text-xs font-bold transition-colors ${displayAsLight ? 'text-gray-600 hover:text-aerojet-blue' : 'text-white hover:text-gray-200'}`}
                >
                  {status === 'authenticated' ? (isStaffOrAdmin ? 'DASHBOARD' : 'MY PORTAL') : 'PORTAL LOGIN'}
                </Link>
                
                {!isStaffOrAdmin && (
                  <Link href="/register" className="bg-aerojet-sky text-white px-4 py-2 rounded-md font-bold text-xs hover:bg-aerojet-light transition shadow-lg uppercase">
                      {status === 'authenticated' ? 'Apply Now' : 'Register'}
                  </Link>
                )}
              </>
          </div>
          <button className="md:hidden p-2 focus:outline-none relative z-50" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
            <div className={`w-6 h-0.5 mb-1.5 transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-2 bg-aerojet-blue" : (headerIsLight ? "bg-aerojet-blue" : "bg-white")}`}></div>
            <div className={`w-6 h-0.5 mb-1.5 transition-all duration-300 ${mobileMenuOpen ? "opacity-0" : (headerIsLight ? "bg-aerojet-blue" : "bg-white")}`}></div>
            <div className={`w-6 h-0.5 transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 -translate-y-2 bg-aerojet-blue" : (headerIsLight ? "bg-aerojet-blue" : "bg-white")}`}></div>
          </button>
        </div>
      </header>
      <div className={`fixed inset-0 bg-white z-40 pt-24 px-6 overflow-y-auto transform transition-transform duration-300 ease-in-out md:hidden ${mobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex flex-col space-y-2 pb-20">
          <MobileAccordion title="Courses" links={navLinks.courses} onLinkClick={() => setMobileMenuOpen(false)} />
          <MobileAccordion title="Admissions" links={navLinks.admissions} onLinkClick={() => setMobileMenuOpen(false)} />
          <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="block border-b border-gray-100 py-4 text-xl font-bold text-aerojet-blue">About Us</Link>
          <Link href="/news" onClick={() => setMobileMenuOpen(false)} className="block border-b border-gray-100 py-4 text-xl font-bold text-aerojet-blue">News</Link>
          <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block border-b border-gray-100 py-4 text-xl font-bold text-aerojet-blue">Contact</Link>
          
          <div className="pt-8 space-y-4">
              <>
                {isStaffOrAdmin && (
                   <Link href="/staff/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex text-center text-white bg-slate-800 font-semibold border border-slate-800 py-3 rounded-md uppercase tracking-wider items-center justify-center gap-2">
                     <Wrench className="w-4 h-4" /> Staff Portal
                   </Link>
                )}
                <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)} className="block text-center text-aerojet-sky font-semibold border border-aerojet-sky py-3 rounded-md">
                  {status === 'authenticated' ? 'Go to Dashboard' : 'Student Portal Login'}
                </Link>
                {!isStaffOrAdmin && (
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="block bg-aerojet-sky text-white text-center py-4 rounded-md shadow-md font-bold uppercase tracking-wider">
                    Start Registration
                  </Link>
                )}
              </>
          </div>
        </div>
      </div>
    </>
  );
}
