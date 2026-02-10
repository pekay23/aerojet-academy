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
              <li><Link href="/faq" className="hover:text-white transition">FAQs</Link></li>
            </ul>
          </div>

          {/* Column 3: Training */}
          <div>
  <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-aerojet-sky">Programmes</h3>
  <ul className="space-y-2 text-gray-300 text-sm">
    <li><Link href="/courses/easa-full-time" className="hover:text-white transition">Full-Time B1/B2</Link></li>
    <li><Link href="/courses/easa-modular" className="hover:text-white transition">Modular Training</Link></li>
    <li><Link href="/courses/examination-only" className="hover:text-white transition">Examination-Only</Link></li> {/* Added */}
    <li><span className="text-gray-500 italic">Pilot Training (Soon)</span></li>
    <li><span className="text-gray-500 italic">Cabin Crew (Soon)</span></li>
  </ul>
</div>

          {/* Column 4: Admissions */}
          <div>
            <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-aerojet-sky">Admissions</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><Link href="/admissions" className="hover:text-white transition">How to Apply</Link></li>
              <li><Link href="/admissions/entry-requirements" className="hover:text-white transition">Requirements</Link></li>
              <li><Link href="/admissions/fees" className="hover:text-white transition">Fees & Rules</Link></li>
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
        
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-6 text-center">
    
    {/* Social Icons - Centered */}
    <div className="flex gap-6">
        <a href="https://facebook.com" target="_blank" className="text-gray-400 hover:text-aerojet-sky transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1V12h3v3h-3v6.8c4.56-.93 8-4.96 8-9.8z"/></svg>
        </a>
        <a href="https://x.com" target="_blank" className="text-gray-400 hover:text-aerojet-sky transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932 6.064-6.932zm-1.292 19.49h2.039L6.486 3.24H4.298l13.311 17.403z"/></svg>
        </a>
        <a href="https://instagram.com" target="_blank" className="text-gray-400 hover:text-aerojet-sky transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.774 4.919 4.851.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.075-1.664 4.704-4.919 4.851-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.775-4.919-4.851-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.075 1.664-4.704 4.919-4.851 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-5.838 2.435-5.838 5.838s2.435 5.838 5.838 5.838 5.838-2.435 5.838-5.838-2.435-5.838-5.838-5.838zm0 9.674c-2.119 0-3.836-1.717-3.836-3.836s1.717-3.836 3.836-3.836 3.836 1.717 3.836 3.836-1.717 3.836-3.836 3.836zm5.272-11.369c0 .763-.619 1.384-1.383 1.384-.764 0-1.383-.621-1.383-1.384 0-.764.619-1.384 1.383-1.384.764 0 1.383.62 1.383 1.384z"/></svg>
        </a>
        <a href="https://linkedin.com" target="_blank" className="text-gray-400 hover:text-aerojet-sky transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
        </a>
    </div>

    {/* Copyright Text - Centered */}
    <p className="text-[10px] text-gray-500 uppercase tracking-[0.2em] font-bold">
        &copy; {new Date().getFullYear()} Aerojet Aviation Training Academy. All Rights Reserved.
    </p>
</div>
  </div>
  </footer>
  );
}
