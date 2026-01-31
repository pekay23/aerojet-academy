import Link from 'next/link';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PageHero from '../../components/PageHero';

export default function PilotTrainingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="grow">
        <PageHero 
          title="Pilot Training"
          subtitle="Take to the skies. Our world-class flight training program is coming soon."
          backgroundImage="/female-pilot.jpg"
        />

        <div className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-3xl mx-auto bg-gray-50 p-10 rounded-2xl border border-gray-200 shadow-sm">
            <span className="bg-aerojet-sky text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider mb-6 inline-block">
              Coming Soon
            </span>
            <h2 className="text-3xl font-bold text-aerojet-blue mb-4">
              Launch Your Career as a Pilot
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Aerojet Academy is finalizing the curriculum for a comprehensive Pilot Training program, taking students from PPL (Private Pilot License) to CPL (Commercial Pilot License). 
            </p>
            <p className="text-gray-600 mb-10">
              Training will include ground school and flight hours on modern training aircraft. Be the first to know when admissions open.
            </p>

            <Link 
              href="/contact?interest=Pilot%20Training" 
              className="bg-aerojet-gold text-aerojet-blue px-10 py-4 rounded-md font-bold text-lg hover:bg-opacity-90 transition inline-block"
            >
              Register Your Interest
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
