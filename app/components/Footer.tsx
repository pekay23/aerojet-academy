import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-aerojet-blue text-white">
      <div className="container mx-auto px-6 py-8"> {/* Reduced py-12 to py-8 */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Column 1: Logo and Info */}
          <div className="col-span-2 lg:col-span-1">
            <Image
              src="/logo-footer.png"
              alt="Aerojet Academy Footer Logo"
              width={160} // Reduced size
              height={40}
              className="mb-3"
            />
            <p className="text-gray-400 text-sm">
              The future of aviation training starts here.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-bold text-base mb-3">Quick Links</h3> {/* Reduced font size and margin */}
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><Link href="/" className="hover:text-aerojet-gold">Home</Link></li>
              <li><Link href="/about" className="hover:text-aerojet-gold">About Us</Link></li>
              <li><Link href="/news" className="hover:text-aerojet-gold">News & Events</Link></li>
              <li><Link href="/contact" className="hover:text-aerojet-gold">Contact</Link></li>
            </ul>
          </div>

          {/* ... (Other columns are the same but will feel more compact) ... */}
          
          {/* Column 3: Training */}
          <div>
            <h3 className="font-bold text-base mb-3">Training</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><Link href="/courses/pilot" className="hover:text-aerojet-gold">Pilot Training</Link></li>
              <li><Link href="/courses/engineering" className="hover:text-aerojet-gold">Engineering</Link></li>
              <li><Link href="/courses/cabin-crew" className="hover:text-aerojet-gold">Cabin Crew</Link></li>
            </ul>
          </div>

          {/* Column 4: Admissions */}
          <div>
            <h3 className="font-bold text-base mb-3">Admissions</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><Link href="/admissions" className="hover:text-aerojet-gold">How to Apply</Link></li>
              <li><Link href="/portal/login" className="hover:text-aerojet-gold">Student Portal</Link></li>
            </ul>
          </div>
          
          {/* Column 5: Contact */}
          <div className="col-span-2 md:col-span-1">
            <h3 className="font-bold text-base mb-3">Contact Us</h3>
            <p className="text-sm text-gray-300">
              123 Airport Road,<br/>
              Accra, Ghana<br/>
              <a href="mailto:admissions@aerojet-academy.com" className="hover:text-aerojet-gold">admissions@aerojet-academy.com</a>
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-700 pt-4 text-center text-xs text-gray-500"> {/* Reduced spacing */}
          <p>&copy; {new Date().getFullYear()} Aerojet Academy. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
