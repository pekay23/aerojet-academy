import Link from 'next/link';
import Navbar from '@/app/components/marketing/Navbar';
import Footer from '@/app/components/marketing/Footer';
import PageHero from '@/app/components/marketing/PageHero';

export default function CabinCrewPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <div className="grow">
        <PageHero 
          title="Cabin Crew Training"
          subtitle="Excellence in safety and service. Prepare for a career with top global airlines."
          backgroundImage="/air-hoster.jpg"
        />

        <div className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto bg-gray-50 p-10 rounded-2xl border border-gray-200 shadow-sm">
            <span className="bg-aerojet-sky text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-6 inline-block">
              Coming Soon
            </span>
            <h2 className="text-3xl font-bold text-aerojet-blue mb-4">
              Become the Face of the Airline
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Our upcoming Cabin Crew training module is designed to meet international safety and service standards. You will learn emergency procedures, first aid, customer service excellence, and aviation regulations.
            </p>
            <p className="text-gray-600 mb-10">
              Join the waitlist to receive the syllabus and fee structure as soon as it is released.
            </p>

            <Link 
              href="/contact?interest=Cabin%20Crew" 
              className="bg-aerojet-gold text-aerojet-blue px-10 py-4 rounded-md font-bold text-lg hover:bg-opacity-90 transition inline-block"
            >
              Join the Waitlist
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
