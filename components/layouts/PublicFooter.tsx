import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react'

const quickLinks = [
  { label: '4-Year Full-Time', href: '/courses/aircraft-engineering/easa-part-66/four-year-b1-b2' },
  { label: '2-Year Full-Time', href: '/courses/aircraft-engineering/easa-part-66/two-year-b1' },
  {
    label: 'Military Certification',
    href: '/courses/aircraft-engineering/easa-part-66/military-certification',
  },
  {
    label: 'Modular Training',
    href: '/courses/aircraft-engineering/easa-part-66/modular-training',
  },
  { label: 'Exam Only', href: '/courses/aircraft-engineering/easa-part-66/exam-only' },
  {
    label: 'Revision Support',
    href: '/courses/aircraft-engineering/easa-part-66/revision-support',
  },
]

const admissionsLinks = [
  { label: 'Entry Requirements', href: '/admissions/entry-requirements' },
  { label: 'Fees & Payment', href: '/admissions/fees-and-payment' },
  { label: 'FAQ', href: '/admissions/faq' },
  { label: 'Register', href: '/register' },
]

const companyLinks = [
  { label: 'About Us', href: '/about' },
  { label: 'Accra MRO Project', href: '/about/accra-mro-project' },
  { label: 'Newsroom', href: '/newsroom' },
]

export default function PublicFooter() {
  return (
    <footer className="bg-aerojet-blue text-white">
      <div className="container mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:grid-cols-5">
          {/* Column 1: Logo */}
          <div className="col-span-1 lg:col-span-1">
            <Link href="/">
              <Image
                src="/images/logos/logo-footer.webp"
                alt="Aerojet Footer Logo"
                width={160}
                height={40}
                className="mb-4"
              />
            </Link>
            <p className="text-sm leading-relaxed text-gray-400">
              Africa's foremost EASA Part-147 certified aviation training institution.
            </p>
          </div>

          {/* Column 2: Programmes */}
          <div>
            {/* --- FIX: Added color here --- */}
            <h3 className="text-public-secondary mb-4 text-sm font-bold tracking-widest uppercase">
              Programmes
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Admissions */}
          <div>
            {/* --- FIX: Added color here --- */}
            <h3 className="text-public-secondary mb-4 text-sm font-bold tracking-widest uppercase">
              Admissions
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              {admissionsLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            {/* --- FIX: Added color here --- */}
            <h3 className="text-public-secondary mb-4 text-sm font-bold tracking-widest uppercase">
              Company
            </h3>
            <ul className="space-y-2 text-sm text-gray-300">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Contact */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            {/* --- FIX: Added color here --- */}
            <h3 className="text-public-secondary mb-4 text-sm font-bold tracking-widest uppercase">
              Contact Us
            </h3>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <MapPin
                  className="text-public-secondary mt-0.5 h-5 w-5 shrink-0"
                  aria-hidden="true"
                />
                <span>ATTC, Kokomlemle, Accra, Ghana</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="text-public-secondary h-5 w-5 shrink-0" aria-hidden="true" />
                <a href="tel:+233209848423" className="transition hover:text-white">
                  +233-20-984-8423
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="text-public-secondary h-5 w-5 shrink-0" aria-hidden="true" />
                <a
                  href="mailto:trainingprograms@aerojet-academy.com"
                  className="break-all transition hover:text-white"
                >
                  trainingprograms@aerojet-academy.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-6 border-t border-white/5 pt-8 text-center">
          <div className="flex gap-6">
            <a
              href="https://www.facebook.com/profile.php?id=100092872480952"
              target="_blank"
              className="hover:text-public-secondary text-gray-400 transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href="https://x.com/aerojet_academy"
              target="_blank"
              className="hover:text-public-secondary text-gray-400 transition-colors"
              aria-label="Twitter/X"
            >
              <Twitter className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href="https://www.instagram.com/aerojet_academy/"
              target="_blank"
              className="hover:text-public-secondary text-gray-400 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="h-5 w-5" aria-hidden="true" />
            </a>
            <a
              href="https://www.linkedin.com/company/aerojet-aviation-training-academy/"
              target="_blank"
              className="hover:text-public-secondary text-gray-400 transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>
          <p className="text-[10px] font-bold tracking-[0.2em] text-gray-300 uppercase">
            &copy; {new Date().getFullYear()} Aerojet Aviation. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
