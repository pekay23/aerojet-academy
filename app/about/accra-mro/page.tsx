import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Accra MRO Project',
};

export default function MROProjectPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <div className="grow">
        <PageHero 
          title="Accra MRO Project"
          subtitle="Establishing West Africa's premier Maintenance, Repair, and Overhaul hub."
          backgroundImage="/hanger.jpg"
        />

        <div className="container mx-auto px-6 py-20">
          <div className="max-w-4xl mx-auto space-y-12">
            
            <section>
                <div className="w-16 h-1.5 bg-aerojet-sky mb-6 rounded-full" />
                <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Vision & Purpose</h2>
                <p className="text-slate-600 leading-relaxed text-lg font-medium">
                    The Accra MRO Project is a flagship initiative by Aerojet Aviation to position Ghana as the primary aviation technical hub for the West African sub-region.
                </p>
                <p className="text-slate-500 leading-relaxed mt-4">
                    Currently, a significant percentage of heavy aircraft maintenance for regional carriers is performed outside of Africa. This project aims to localize those services, reducing operational costs for airlines and retaining economic value within the continent.
                </p>
            </section>

            <section className="grid md:grid-cols-2 gap-8">
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-black text-aerojet-blue uppercase text-sm tracking-widest mb-4">Local Capacity</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        By building a world-class facility in Accra, we are solving the critical gap in local maintenance infrastructure, allowing for faster turnaround times and higher safety oversight.
                    </p>
                </div>
                <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-sm">
                    <h3 className="font-black text-aerojet-blue uppercase text-sm tracking-widest mb-4">Economic Impact</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                        The project is expected to create hundreds of direct high-skilled jobs and thousands of indirect opportunities within the aviation supply chain.
                    </p>
                </div>
            </section>

            <section className="bg-aerojet-blue text-white rounded-[3rem] p-10 md:p-16 shadow-2xl relative overflow-hidden">
                <div className="relative z-10">
                    <h2 className="text-2xl font-black uppercase mb-6">The Role of the Academy</h2>
                    <p className="text-blue-100 leading-relaxed mb-8">
                        A world-class MRO facility requires world-class engineers. Aerojet Academy was established as the primary human-capital engine for this project, ensuring that every technician is trained to international EASA Part-66 standards.
                    </p>
                    <Link href="/about" className="inline-block bg-white text-aerojet-blue px-8 py-3 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-aerojet-sky hover:text-white transition-all">
                        Learn More About the Academy
                    </Link>
                </div>
            </section>

          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
