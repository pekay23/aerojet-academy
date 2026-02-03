import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-aerojet-blue text-white">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12">
          {/* Column 1: Logo */}
          <div className="col-span-1 lg:col-span-1">
            <Image
              src="/logo-footer.png"
              alt="Aerojet Academy Footer Logo"
              width={160}
              height={40}
              className="mb-4"
            />
            <p className="text-gray-400 text-sm leading-relaxed">
              The future of aviation training starts here. EASA-aligned technical excellence in the heart of Accra.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-aerojet-sky">Quick Links</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><Link href="/" className="hover:text-white transition">Home</Link></li>
              <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
              <li><Link href="/news" className="hover:text-white transition">Newsroom</Link></li>
              <li><Link href="/legal/terms" className="hover:text-white transition">Application Terms</Link></li>
            </ul>
          </div>

          {/* Column 3: Training */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-aerojet-sky">Programmes</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><Link href="/courses/easa-full-time" className="hover:text-white transition">Full-Time B1/B2</Link></li>
              <li><Link href="/courses/easa-modular" className="hover:text-white transition">Modular Training</Link></li>
              <li><span className="text-gray-500 italic">Pilot Training (Soon)</span></li>
              <li><span className="text-gray-500 italic">Cabin Crew (Soon)</span></li>
            </ul>
          </div>

          {/* Column 4: Admissions */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-aerojet-sky">Admissions</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><Link href="/admissions" className="hover:text-white transition">How to Enroll</Link></li>
              <li><Link href="/admissions/fees" className="hover:text-white transition">Fees & Rules</Link></li>
              <li><Link href="/portal/login" className="hover:text-white transition">Student Portal</Link></li>
            </ul>
          </div>
          
          {/* Column 5: Contact - WITH ICONS */}
          <div className="col-span-1">
            <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-aerojet-sky">Contact Us</h3>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-start gap-3">
                <svg className="w-5 h-5 text-aerojet-sky shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span>ATTC Small Engines Department, Kokomlemle, Accra, Ghana</span>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-aerojet-sky shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 004.516 4.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                <a href="tel:+233209848423" className="hover:text-white transition">+233-20-984-8423</a>
              </li>
              <li className="flex items-center gap-3">
                <svg className="w-5 h-5 text-aerojet-sky shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                <a href="mailto:trainingprograms@aerojet-academy.com" className="hover:text-white transition break-all">trainingprograms@aerojet-academy.com</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/5 pt-6 text-center text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">
          <p>&copy; {new Date().getFullYear()} Aerojet Aviation Training Academy. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
