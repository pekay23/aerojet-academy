import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import NextSteps from '@/components/NextSteps';

export const metadata: Metadata = {
  title: 'Cabin Crew Training',
};

export default function CabinCrewPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="grow">
        <PageHero 
          title="Cabin Crew Training"
          subtitle="Excellence in safety and service. Prepare for an elite career with top global airlines."
          backgroundImage="/air-hoster.jpg"
        />

        <div className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto bg-slate-50 p-10 md:p-16 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
                <span className="bg-aerojet-sky text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 inline-block">
                Accepting Expressions of Interest
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-aerojet-blue uppercase tracking-tight mb-6">
                Become the Face of the Airline
                </h2>
                <p className="text-slate-600 text-lg mb-8 leading-relaxed font-medium">
                Our upcoming Cabin Crew training module is designed to meet international safety and service standards. You will master emergency procedures, first aid, customer service excellence, and aviation regulations.
                </p>
                <p className="text-slate-500 mb-12 max-w-2xl mx-auto">
                Join our priority waitlist to receive the syllabus, fee structure, and physical requirement guidelines as soon as they are released.
                </p>

                <Link 
                href="/contact?interest=Cabin%20Crew" 
                className="bg-aerojet-sky text-white px-12 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-aerojet-blue transition-all shadow-lg shadow-blue-100 active:scale-95 inline-block"
                >
                Join the Priority Waitlist
                </Link>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-6 pb-20">
            <NextSteps />
        </div>
      </div>
      <Footer />
    </main>
  );
}
