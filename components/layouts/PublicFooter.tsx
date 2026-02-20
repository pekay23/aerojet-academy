import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Phone, Mail, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const quickLinks = [
  { label: "4-Year Full-Time", href: "/courses/four-year-b1-b2" },
  { label: "2-Year Full-Time", href: "/courses/two-year-b1" },
  { label: "Modular Training", href: "/courses/modular-training" },
  { label: "Exam Only", href: "/courses/exam-only" },
  { label: "Module Requirements", href: "/courses/module-requirements" },
];

const admissionsLinks = [
  { label: "Entry Requirements", href: "/admissions/entry-requirements" },
  { label: "Fees & Payment", href: "/admissions/fees-and-payment" },
  { label: "FAQ", href: "/admissions/faq" },
  { label: "Register", href: "/register" },
];

const companyLinks = [
  { label: "About Us", href: "/about" },
  { label: "Accra MRO Project", href: "/about/accra-mro-project" },
  { label: "Newsroom", href: "/newsroom" },
  { label: "Contact", href: "/contact" },
];

export default function PublicFooter() {
  return (
    <footer className="bg-[#002a5c] text-white">
      <div className="container mx-auto max-w-7xl px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12">
          {/* Column 1: Logo */}
          <div className="col-span-1 lg:col-span-1">
            <Link href="/">
              <Image src="/images/logos/logo-footer.png" alt="Aerojet Footer Logo" width={160} height={40} className="mb-4" />
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Africa's foremost EASA Part-147 certified aviation training institution.
            </p>
          </div>

          {/* Column 2: Programmes */}
          <div>
            {/* --- FIX: Added color here --- */}
            <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-[#4c9ded]">Programmes</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              {quickLinks.map(link => (
                <li key={link.href}><Link href={link.href} className="hover:text-white transition">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Column 3: Admissions */}
          <div>
            {/* --- FIX: Added color here --- */}
            <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-[#4c9ded]">Admissions</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              {admissionsLinks.map(link => (
                <li key={link.href}><Link href={link.href} className="hover:text-white transition">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Column 4: Company */}
          <div>
            {/* --- FIX: Added color here --- */}
            <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-[#4c9ded]">Company</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              {companyLinks.map(link => (
                <li key={link.href}><Link href={link.href} className="hover:text-white transition">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          {/* Column 5: Contact */}
          <div className="col-span-1 md:col-span-2 lg:col-span-1">
            {/* --- FIX: Added color here --- */}
            <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-[#4c9ded]">Contact Us</h3>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                {/* --- FIX: Added color here --- */}
                <MapPin className="w-5 h-5 text-[#4c9ded] shrink-0 mt-0.5" />
                <span>ATTC, Kokomlemle, Accra, Ghana</span>
              </li>
              <li className="flex items-center gap-3">
                {/* --- FIX: Added color here --- */}
                <Phone className="w-5 h-5 text-[#4c9ded] shrink-0" />
                <a href="tel:+233209848423" className="hover:text-white transition">+233-20-984-8423</a>
              </li>
              <li className="flex items-center gap-3">
                {/* --- FIX: Added color here --- */}
                <Mail className="w-5 h-5 text-[#4c9ded] shrink-0" />
                <a href="mailto:trainingprograms@aerojet-academy.com" className="hover:text-white transition break-all">trainingprograms@aerojet-academy.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-6 text-center">
          <div className="flex gap-6">
            <a href="https://www.facebook.com/profile.php?id=100092872480952" target="_blank" className="text-gray-400 hover:text-[#4c9ded] transition-colors"><Facebook className="w-5 h-5" /></a>
            <a href="https://x.com/aerojet_academy" target="_blank" className="text-gray-400 hover:text-[#4c9ded] transition-colors"><Twitter className="w-5 h-5" /></a>
            <a href="https://www.instagram.com/aerojet_academy/" target="_blank" className="text-gray-400 hover:text-[#4c9ded] transition-colors"><Instagram className="w-5 h-5" /></a>
            <a href="https://www.linkedin.com/company/aerojet-aviation-training-academy/" target="_blank" className="text-gray-400 hover:text-[#4c9ded] transition-colors"><Linkedin className="w-5 h-5" /></a>
          </div>
          <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">
            &copy; {new Date().getFullYear()} Aerojet Aviation. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
