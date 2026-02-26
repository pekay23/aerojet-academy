'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'

// ===== START: TYPE DEFINITIONS TO FIX THE ERROR =====

// Define the shape of a single link
interface NavLink {
  href: string
  label: string
  disabled?: boolean // The '?' makes this property optional
}

// Define the shape of a group of links
interface NavGroup {
  value: string
  title: string
  links: NavLink[]
}

// Update the main data structure to use these types
const navLinks: {
  label: string
  href?: string
  isDropdown?: boolean
  groups?: NavGroup[]
}[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Courses',
    isDropdown: true,
    href: '/courses', // Add href for the main link
    groups: [
      {
        value: 'item-1',
        title: 'Aircraft Engineering',
        links: [
          {
            href: '/courses/aircraft-engineering/easa-part-66/four-year-b1-b2',
            label: '4-Year Full-Time (B1.1 & B2)',
          },
          {
            href: '/courses/aircraft-engineering/easa-part-66/two-year-b1',
            label: '2-Year Full-Time (B1.1)',
          },
          {
            href: '/courses/aircraft-engineering/easa-part-66/military-certification',
            label: 'Military / Industry (1 Year)',
          },
          {
            href: '/courses/aircraft-engineering/easa-part-66/modular-training',
            label: 'Modular Training',
          },
          {
            href: '/courses/aircraft-engineering/easa-part-66/exam-only',
            label: 'Exam Only',
          },
          {
            href: '/courses/aircraft-engineering/easa-part-66/revision-support',
            label: 'Revision Support',
          },
          {
            href: '/courses/aircraft-engineering/exam-schedule',
            label: 'Exam Schedule 2026/2027',
          },
        ],
      },
      { value: 'item-2', title: 'Skilled Training Programs', links: [] },
      { value: 'item-3', title: 'Certified Short Knowledge Courses', links: [] },
    ],
  },
  { label: 'Admissions', href: '/admissions' },
  { label: 'Newsroom', href: '/newsroom' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
]
// ===== END: TYPE DEFINITIONS =====

export default function PublicNav() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
  }, [mobileOpen])

  const [hasForceClass, setHasForceClass] = useState(false)
  useEffect(() => {
    // Initial check
    setHasForceClass(document.body.classList.contains('force-navbar-solid'))

    // Observe changes to body classes (for error pages that mount/unmount)
    const observer = new MutationObserver(() => {
      setHasForceClass(document.body.classList.contains('force-navbar-solid'))
    })
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Detect system pages or pages that don't transition well with transparent nav
  const isErrorPage = pathname === '/404' || pathname === '/500' || pathname.includes('/error')
  const forceSolid =
    isErrorPage ||
    hasForceClass ||
    pathname.startsWith('/_') ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname.startsWith('/privacy-policy') ||
    pathname.startsWith('/online-application-terms')

  const headerClasses = `fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${scrolled || mobileOpen || forceSolid ? 'bg-white/95 backdrop-blur-xl shadow-sm border-slate-100' : 'bg-transparent border-transparent'}`
  const linkColorClasses = scrolled || mobileOpen || forceSolid ? 'text-slate-700' : 'text-white'
  const activeLinkColorClasses =
    scrolled || mobileOpen || forceSolid ? 'text-public-secondary' : 'text-white'

  return (
    <>
      <header className={headerClasses}>
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="shrink-0">
            <Image
              src={
                scrolled || mobileOpen || forceSolid
                  ? '/images/logos/AATA_logo_hor_onWhite.webp'
                  : '/images/logos/ATA_logo_hor_onDark.webp'
              }
              alt="Aerojet Logo"
              width={150}
              height={38}
              priority
            />
          </Link>

          <div className="hidden flex-1 items-center justify-center lg:flex">
            <NavigationMenu>
              <NavigationMenuList>
                {navLinks.map((item) =>
                  item.isDropdown ? (
                    <NavigationMenuItem key={item.label}>
                      <Link href={item.href || '#'}>
                        {/* @next-codemod-error This Link previously used the now removed `legacyBehavior` prop, and has a child that might not be an anchor. The codemod bailed out of lifting the child props to the Link. Check that the child component does not render an anchor, and potentially move the props manually to Link. */}
                        <NavigationMenuTrigger
                          className={`text-sm font-bold uppercase ${linkColorClasses} hover:${activeLinkColorClasses} bg-transparent`}
                        >
                          {item.label}
                        </NavigationMenuTrigger>
                      </Link>
                      <NavigationMenuContent>
                        <div className="w-[400px] p-4 md:w-[500px]">
                          <Accordion type="single" collapsible defaultValue="item-1">
                            {item.groups?.map((group) => (
                              <AccordionItem value={group.value} key={group.value}>
                                <AccordionTrigger className="text-public-primary px-3 text-sm font-bold hover:no-underline">
                                  {group.title}
                                </AccordionTrigger>
                                <AccordionContent className="pt-2">
                                  {group.links.length > 0 ? (
                                    group.links.map((link) => (
                                      <Link
                                        href={link.disabled ? '#' : link.href}
                                        key={link.href}
                                        className={`block rounded-md p-3 leading-none no-underline transition-colors outline-none select-none hover:bg-slate-100 ${link.disabled ? 'cursor-not-allowed opacity-60' : ''}`}
                                      >
                                        <div className="text-public-dark text-sm leading-none font-medium">
                                          {link.label}
                                        </div>
                                      </Link>
                                    ))
                                  ) : (
                                    <p className="px-3 py-2 text-sm text-slate-500">Coming soon.</p>
                                  )}
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
                        className={`relative px-4 py-2 text-xs font-black tracking-[0.2em] uppercase transition-all duration-300 ${
                          pathname === item.href ? activeLinkColorClasses : linkColorClasses
                        } hover:${activeLinkColorClasses}`}
                      >
                        {pathname === item.href && (
                          <motion.div
                            layoutId="nav-pill"
                            className={`absolute inset-0 rounded-full ${
                              scrolled || mobileOpen || forceSolid
                                ? 'bg-[#002a5c]/5'
                                : 'bg-white/10'
                            }`}
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <span className="relative z-10">{item.label}</span>
                      </Link>
                    </NavigationMenuItem>
                  )
                )}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={`hidden items-center rounded-lg px-4 py-2 text-xs font-bold tracking-widest uppercase transition-all sm:inline-flex ${scrolled || forceSolid ? 'hover:text-public-primary text-slate-500' : 'text-white/80 hover:text-white'}`}
            >
              Login
            </Link>
            <Link
              href="/register"
              className="bg-public-secondary hover:bg-public-primary hidden h-11 items-center rounded-xl px-5 py-2.5 text-[10px] font-black tracking-widest text-white uppercase transition-all sm:inline-flex"
            >
              Register
            </Link>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`flex h-11 w-11 items-center justify-center rounded-lg transition-all lg:hidden ${linkColorClasses}`}
              aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              {mobileOpen ? (
                <X className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </header>
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
              onClick={() => setMobileOpen(false)}
            />
            <motion.nav
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[85%] max-w-sm overflow-y-auto bg-white"
            >
              <div className="flex items-center justify-between border-b p-6">
                <span className="text-public-primary text-lg font-black uppercase">Menu</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="flex h-11 w-11 items-center justify-center p-2"
                  aria-label="Close menu"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <div className="p-4">
                {navLinks.map((item) =>
                  item.isDropdown ? (
                    <Accordion type="single" collapsible className="w-full" key={item.label}>
                      <AccordionItem value="courses-mobile" className="border-b-0">
                        <AccordionTrigger className="py-3 text-base font-bold text-slate-700 hover:no-underline">
                          {item.label}
                        </AccordionTrigger>
                        <AccordionContent>
                          {item.groups?.map((group) => (
                            <div key={group.value} className="mb-2 ml-4 border-l pl-4">
                              <h4 className="text-public-primary mb-2 font-bold">{group.title}</h4>
                              {group.links.length > 0 ? (
                                group.links.map((link) => (
                                  <Link
                                    key={link.label}
                                    href={link.disabled ? '#' : link.href}
                                    className={`block py-2 text-sm text-slate-600 ${link.disabled ? 'cursor-not-allowed opacity-50' : 'hover:text-public-primary'}`}
                                  >
                                    {link.label}
                                  </Link>
                                ))
                              ) : (
                                <p className="py-2 text-sm text-slate-400">Coming soon.</p>
                              )}
                            </div>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href || '#'}
                      className="block py-3 text-base font-bold text-slate-700"
                    >
                      {item.label}
                    </Link>
                  )
                )}
              </div>
              <div className="mt-4 space-y-3 border-t p-6">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild className="bg-public-secondary w-full text-white">
                  <Link href="/register">Register Now</Link>
                </Button>
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
