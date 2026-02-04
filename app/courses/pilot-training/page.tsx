import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import NextSteps from '@/components/NextSteps';

export const metadata: Metadata = {
  title: 'Pilot Training',
};

export default function PilotTrainingPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="grow">
        <PageHero 
          title="Pilot Training"
          subtitle="Take to the skies. Our world-class flight training programme is currently in development."
          backgroundImage="/pilot.jpg"
        />

        <div className="container mx-auto px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto bg-slate-50 p-10 md:p-16 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
                <span className="bg-aerojet-sky text-white px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 inline-block">
                Programme Launching Soon
                </span>
                <h2 className="text-3xl md:text-5xl font-black text-aerojet-blue uppercase tracking-tight mb-6">
                Launch Your Career as a Pilot
                </h2>
                <p className="text-slate-600 text-lg mb-8 leading-relaxed font-medium">
                Aerojet Academy is finalizing the curriculum for a comprehensive Pilot Training programme, designed to take students from PPL (Private Pilot Licence) through to CPL (Commercial Pilot Licence) standards. 
                </p>
                <p className="text-slate-500 mb-12 max-w-2xl mx-auto">
                Training will include rigorous ground school and flight hours on modern training aircraft. Be the first to receive the syllabus and intake dates by registering your interest today.
                </p>

                <Link 
                href="/contact?interest=Pilot%20Training" 
                className="bg-aerojet-sky text-white px-12 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-aerojet-blue transition-all shadow-lg shadow-blue-100 active:scale-95 inline-block"
                >
                Register Your Interest
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
