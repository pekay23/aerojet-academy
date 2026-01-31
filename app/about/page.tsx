import Link from 'next/link';
import Image from 'next/image';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PageHero from '../components/PageHero';

export default function AboutPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="grow">
        <PageHero 
          title="About Aerojet Academy"
          subtitle="Building the future of African aviation, one certified technician at a time."
          backgroundImage="/aircraft-full.jpg"
        />

        <div className="container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-3 gap-12">

            {/* Main Content */}
            <div className="lg:col-span-2">
              <section>
                <h2 className="text-3xl font-bold text-aerojet-blue mb-4">Our Mission</h2>
                <p className="text-gray-700 leading-relaxed">
                  Our mission is to provide world-class, EASA-standard technical training and create career opportunities for aspiring aviation professionals. We are committed to developing a highly skilled workforce ready to meet the demands of the growing aviation industry in Ghana and across the African continent.
                </p>
              </section>
              <section className="mt-10">
                <h2 className="text-3xl font-bold text-aerojet-blue mb-4">The Accra MRO Project</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Aerojet Aviation Training Academy was developed as a foundational component of Aerojet’s flagship Accra MRO Project. This ambitious initiative aims to establish a state-of-the-art Maintenance, Repair, and Overhaul (MRO) facility in Accra, reducing the region's reliance on overseas maintenance and creating hundreds of skilled jobs.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  The academy is the first step in building the local human capacity required to make this vision a reality, ensuring that Ghanaian and African technicians are at the forefront of this industrial growth.
                </p>
              </section>
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1">
              <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
                <h3 className="font-bold text-lg mb-4 text-aerojet-blue">Key Facts</h3>
                <ul className="space-y-4 text-sm">
                  <li className="flex items-start"><span className="text-aerojet-sky font-bold mr-2 mt-1">✔</span>Training aligned to EASA Part-66 standards.</li>
                  <li className="flex items-start"><span className="text-aerojet-sky font-bold mr-2 mt-1">✔</span>First student cohort already in training.</li>
                  <li className="flex items-start"><span className="text-aerojet-sky font-bold mr-2 mt-1">✔</span>Located at the Accra Technical Training Centre (ATTC).</li>
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
