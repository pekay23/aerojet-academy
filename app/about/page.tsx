import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'About Us',
};

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
          <div className="grid lg:grid-cols-3 gap-16">

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-12">
              <section>
                <div className="w-16 h-1.5 bg-aerojet-sky mb-6 rounded-full" />
                <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Our Mission</h2>
                <p className="text-slate-600 leading-relaxed text-lg font-medium">
                  Our mission is to provide world-class, EASA-standard technical training and create career opportunities for aspiring aviation professionals. 
                </p>
                <p className="text-slate-500 leading-relaxed mt-4">
                  We are committed to developing a highly skilled workforce ready to meet the demands of the growing aviation industry in Ghana and across the African continent. Through a combination of rigorous theory and immersive practical experience, we empower the next generation of engineers.
                </p>
              </section>

              <section>
    <div className="w-16 h-1.5 bg-aerojet-sky mb-6 rounded-full" />
    <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">The Accra MRO Project</h2>
    <p className="text-slate-600 leading-relaxed mb-4">
      Aerojet Aviation Training Academy was developed as a foundational component of Aerojet’s flagship Accra MRO Project.
    </p>
    {/* ADDED LINK HERE */}
    <Link href="/about/accra-mro" className="text-aerojet-sky font-bold hover:underline inline-flex items-center">
        Read more about the Accra MRO Project ↗
    </Link>
</section>
            </div>

            {/* Sidebar Facts */}
            <aside className="lg:col-span-1">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200 shadow-sm sticky top-28">
                <h3 className="font-black text-sm uppercase tracking-widest mb-6 text-aerojet-blue border-b border-slate-200 pb-4">Academy Highlights</h3>
                <ul className="space-y-6">
                  <li className="flex items-start">
                    <span className="bg-aerojet-sky text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mr-4 mt-1 shrink-0">✓</span>
                    <p className="text-sm text-slate-700 font-medium">Training aligned to strict EASA Part-66 standards.</p>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-aerojet-sky text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mr-4 mt-1 shrink-0">✓</span>
                    <p className="text-sm text-slate-700 font-medium">Inaugural cohort of students already in training.</p>
                  </li>
                  <li className="flex items-start">
                    <span className="bg-aerojet-sky text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold mr-4 mt-1 shrink-0">✓</span>
                    <p className="text-sm text-slate-700 font-medium">Strategically located at the Accra Technical Training Centre (ATTC).</p>
                  </li>
                </ul>

                <div className="mt-10 pt-8 border-t border-slate-200">
                    <Link href="/courses" className="block text-center bg-aerojet-blue text-white font-black uppercase text-[10px] tracking-widest py-4 rounded-xl shadow-lg hover:bg-aerojet-sky transition-all">
                        Explore Programmes
                    </Link>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
