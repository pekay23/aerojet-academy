import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Phone, Mail } from 'lucide-react'

const Facebook = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 1.092.063 1.376.126v3.205c-.244-.023-.666-.023-.95-.023-1.341 0-1.862.508-1.862 1.83v2.42h3.564l-.609 3.667h-2.955v8.139C19.396 22.838 24 17.905 24 12c0-6.627-5.373-12-12-12S0 5.373 0 12c0 5.628 3.875 10.35 9.101 11.691" />
  </svg>
)

const Twitter = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
)

const Instagram = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M7.03.084c-1.277.06-2.149.264-2.913.558a5.886 5.886 0 0 0-2.126 1.384A5.886 5.886 0 0 0 .607 4.152C.313 4.916.11 5.787.048 7.065.007 7.89 0 8.154 0 12.002c0 3.846.007 4.111.048 4.936.06 1.277.264 2.149.558 2.913a5.886 5.886 0 0 0 1.384 2.126 5.886 5.886 0 0 0 2.126 1.384c.764.294 1.636.498 2.913.558C7.89 23.993 8.154 24 12.002 24c3.846 0 4.111-.007 4.936-.048 1.277-.06 2.149-.264 2.913-.558a5.886 5.886 0 0 0 2.126-1.384 5.886 5.886 0 0 0 1.384-2.126c.294-.764.498-1.636.558-2.913.04-.825.048-1.09.048-4.936 0-3.848-.007-4.112-.048-4.937-.06-1.277-.264-2.149-.558-2.913a5.886 5.886 0 0 0-1.384-2.126A5.886 5.886 0 0 0 19.851.643C19.087.348 18.215.144 16.938.084 16.113.044 15.848.036 12.002.036c-3.848 0-4.112.007-4.937.048zm.116 2.168c.823-.037 1.07-.044 4.849-.044 3.777 0 4.025.007 4.847.044 1.17.053 1.805.249 2.228.413.56.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.037.823.044 1.07.044 4.849 0 3.777-.007 4.025-.044 4.847-.053 1.17-.249 1.805-.413 2.228a3.72 3.72 0 0 1-.896 1.382 3.72 3.72 0 0 1-1.381.896c-.422.164-1.057.36-2.228.413-.823.037-1.07.044-4.849.044-3.777 0-4.025-.007-4.847-.044-1.17-.053-1.805-.249-2.228-.413a3.72 3.72 0 0 1-1.382-.896 3.72 3.72 0 0 1-.896-1.381c-.164-.422-.36-1.057-.413-2.228-.037-.823-.044-1.07-.044-4.849 0-3.777.007-4.025.044-4.847.053-1.17.249-1.805.413-2.228.217-.56.477-.96.896-1.382a3.72 3.72 0 0 1 1.381-.896c.422-.164 1.057-.36 2.228-.413zM12 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
  </svg>
)

const Linkedin = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
)

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
      <div className="container mx-auto w-full px-6 py-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 lg:grid-cols-5">
          {/* Column 1: Logo */}
          <div className="col-span-1 lg:col-span-1">
            <Link href="/">
              <Image
                src="/images/logos/logo-footer.webp"
                alt="Aerojet Footer Logo"
                width={160}
                height={40}
                style={{ width: 'auto', height: 'auto' }}
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
