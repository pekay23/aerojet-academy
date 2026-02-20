"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

// ===== START: TYPE DEFINITIONS TO FIX THE ERROR =====

// Define the shape of a single link
interface NavLink {
  href: string;
  label: string;
  disabled?: boolean; // The '?' makes this property optional
}

// Define the shape of a group of links
interface NavGroup {
  value: string;
  title: string;
  links: NavLink[];
}

// Update the main data structure to use these types
const navLinks: {
  label: string;
  href?: string;
  isDropdown?: boolean;
  groups?: NavGroup[];
}[] = [
  { label: "Home", href: "/" },
  {
    label: "Courses",
    isDropdown: true,
    href: "/courses", // Add href for the main link
    groups: [
      {
        value: "item-1",
        title: "Aircraft Engineering",
        links: [
          { href: "/courses/aircraft-engineering/easa-part-66", label: "EASA Part-66 Certification Programs" },
          { href: "/courses/aircraft-engineering/skilled-training", label: "Skilled Training Programs" },
          { href: "/courses/aircraft-engineering/short-courses", label: "Certified Short Knowledge Courses" },
          { href: "/courses/aircraft-engineering/work-experience", label: "Aircraft Work Experience Program (coming soon)", disabled: true },
        ],
      },
      { value: "item-2", title: "Skilled Training Programs", links: [] },
      { value: "item-3", title: "Certified Short Knowledge Courses", links: [] },
    ],
  },
  { label: "Admissions", href: "/admissions" },
  { label: "Newsroom", href: "/newsroom" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];
// ===== END: TYPE DEFINITIONS =====

export default function PublicNav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => { setMobileOpen(false) }, [pathname]);
  useEffect(() => { document.body.style.overflow = mobileOpen ? "hidden" : "" }, [mobileOpen]);

  const isErrorPage = pathname.startsWith('/_');
  const headerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled || mobileOpen || isErrorPage ? "bg-white/95 backdrop-blur-xl shadow-sm border-slate-100" : "bg-transparent border-transparent"}`;
  const linkColorClasses = scrolled || mobileOpen || isErrorPage ? "text-slate-700" : "text-white";
  const activeLinkColorClasses = scrolled || mobileOpen || isErrorPage ? "text-public-primary" : "text-white";

  return (
    <>
      <header className={headerClasses}>
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex-shrink-0">
             <Image src={scrolled || mobileOpen || isErrorPage ? "/images/logos/AATA_logo_hor_onWhite.png" : "/images/logos/ATA_logo_hor_onDark.png"} alt="Aerojet Logo" width={150} height={38} priority />
          </Link>

          <div className="hidden lg:flex items-center justify-center flex-1">
            <NavigationMenu>
              <NavigationMenuList>
                {navLinks.map((item) =>
                  item.isDropdown ? (
                    <NavigationMenuItem key={item.label}>
                      <Link href={item.href || '#'}>
                        {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */
                        }
                        <NavigationMenuTrigger className={`text-sm font-bold uppercase ${linkColorClasses} hover:${activeLinkColorClasses} bg-transparent`}>
                          {item.label}
                        </NavigationMenuTrigger>
                      </Link>
                      <NavigationMenuContent>
                        <div className="w-[400px] p-4 md:w-[500px]">
                           <Accordion type="single" collapsible defaultValue="item-1">
                               {item.groups?.map((group) => (
                                   <AccordionItem value={group.value} key={group.value}>
                                       <AccordionTrigger className="px-3 text-sm font-bold text-public-primary hover:no-underline">{group.title}</AccordionTrigger>
                                       <AccordionContent className="pt-2">
                                           {group.links.length > 0 ? group.links.map((link) => (
                                               <Link
                                                 href={link.disabled ? '#' : link.href}
                                                 key={link.href}
                                                 className={`block select-none rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-slate-100 ${link.disabled ? 'cursor-not-allowed opacity-60' : ''}`}>
                                                 <div className="text-sm font-medium leading-none text-public-dark">{link.label}</div>
                                               </Link>
                                           )) : <p className="px-3 py-2 text-sm text-slate-500">Coming soon.</p>}
                                       </AccordionContent>
                                   </AccordionItem>
                               ))}
                           </Accordion>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>
                  ) : (
                    <NavigationMenuItem key={item.label}>
                      <Link
                        href={item.href || '#'}
                        className={`px-4 py-2 text-sm font-bold uppercase transition-colors ${pathname === item.href ? activeLinkColorClasses : linkColorClasses} hover:${activeLinkColorClasses}`}>
                        {item.label}
                      </Link>
                    </NavigationMenuItem>
                  )
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          
          <div className="flex items-center gap-2">
             <Link href="/login" className={`hidden sm:inline-flex items-center px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${scrolled || isErrorPage ? "text-slate-500 hover:text-public-primary" : "text-white/80 hover:text-white"}`}>
                Login
             </Link>
             <Link href="/register" className="hidden sm:inline-flex items-center bg-[#4c9ded] text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#002a5c] transition-all">
                Register
             </Link>
            <button onClick={() => setMobileOpen(!mobileOpen)} className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-lg transition-all ${linkColorClasses}`} aria-label="Toggle menu">
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />
            <motion.nav initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 30, stiffness: 300 }} className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white z-50 overflow-y-auto">
              <div className="p-6 border-b flex items-center justify-between"><span className="text-lg font-black text-public-primary uppercase">Menu</span><button onClick={() => setMobileOpen(false)} className="p-2"><X className="w-5 h-5" /></button></div>
              <div className="p-4">
                 {navLinks.map((item) => item.isDropdown ? (
                     <Accordion type="single" collapsible className="w-full" key={item.label}>
                         <AccordionItem value="courses-mobile" className="border-b-0">
                             <AccordionTrigger className="text-base font-bold text-slate-700 hover:no-underline py-3">{item.label}</AccordionTrigger>
                             <AccordionContent>
                                {item.groups?.map(group => (
                                    <div key={group.value} className="ml-4 border-l pl-4 mb-2">
                                        <h4 className="font-bold text-public-primary mb-2">{group.title}</h4>
                                        {group.links.length > 0 ? group.links.map(link => (
                                            <Link key={link.label} href={link.disabled ? "#" : link.href} className={`block py-2 text-sm text-slate-600 ${link.disabled ? "opacity-50 cursor-not-allowed" : "hover:text-public-primary"}`}>{link.label}</Link>
                                        )) : <p className="py-2 text-sm text-slate-400">Coming soon.</p>}
                                    </div>
                                ))}
                             </AccordionContent>
                         </AccordionItem>
                     </Accordion>
                 ) : (
                     <Link key={item.label} href={item.href || '#'} className="block py-3 text-base font-bold text-slate-700">{item.label}</Link>
                 ))}
              </div>
              <div className="p-6 mt-4 border-t space-y-3">
                 <Button asChild variant="outline" className="w-full"><Link href="/login">Login</Link></Button>
                 <Button asChild className="w-full bg-public-secondary text-white"><Link href="/register">Register Now</Link></Button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
