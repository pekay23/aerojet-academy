import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/app/components/marketing/Navbar';
import Footer from '@/app/components/marketing/Footer';
import PageHero from '@/app/components/marketing/PageHero';
import NextSteps from '@/app/components/marketing/NextSteps';

export const metadata: Metadata = {
  title: 'Examination-Only',
};

export default function ExamOnlyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <div className="grow">
        <PageHero 
          title="Examination-Only"
          subtitle="Certified EASA Part-66 module sittings for self-study candidates and industry professionals."
          backgroundImage="/examonly.jpg"
        />

        <div className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto space-y-24">
            
            <div className="grid md:grid-cols-2 gap-16 items-center">
                <div>
                    <div className="w-16 h-1.5 bg-aerojet-sky mb-6 rounded-full" />
                    <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Professional Testing Environment</h2>
                    <p className="text-slate-600 leading-relaxed mb-4 font-medium text-lg">
                        Aerojet Academy provides a high-standard facility for sitting official EASA Part-66 module exams. 
                    </p>
                    <p className="text-slate-500 leading-relaxed">
                        Seats are limited to a maximum of 28 per sitting to ensure strict invigilation and a focused atmosphere. All bookings, seat assignments, and results are managed via our secure student portal.
                    </p>
                </div>
                
                <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative border-t-4 border-aerojet-sky">
                    <h3 className="font-black uppercase tracking-widest text-xs text-aerojet-sky mb-6">Booking Conditions</h3>
                    <ul className="space-y-5">
                        <li className="flex gap-4">
                            <span className="text-aerojet-sky font-bold">●</span>
                            <p className="text-sm text-slate-300"><b>T-21 Confirmation:</b> Windows are confirmed only if minimum numbers are met 21 days prior.</p>
                        </li>
                        <li className="flex gap-4">
                            <span className="text-aerojet-sky font-bold">●</span>
                            <p className="text-sm text-slate-300"><b>Late Surcharge:</b> Bookings within T-14 incur a €50 admin surcharge if space remains.</p>
                        </li>
                        <li className="flex gap-4">
                            <span className="text-red-500 font-bold">●</span>
                            <p className="text-sm text-slate-300"><b>No-Shows:</b> Seats are forfeited once schedules are locked. Fees roll only if window is cancelled.</p>
                        </li>
                    </ul>
                </div>
            </div>

            {/* Pricing CTA */}
            <section className="bg-slate-50 rounded-[3rem] p-10 md:p-16 border border-slate-100 text-center shadow-inner">
                <h2 className="text-2xl font-black text-aerojet-blue uppercase tracking-widest mb-4">Pricing & Seat Availability</h2>
                <p className="text-slate-500 max-w-2xl mx-auto mb-10 font-medium">
                    Detailed pricing for individual module seats, 2-seat and 4-seat bundles, and Group Charters is visible exclusively within the <b>Student Portal</b>.
                </p>
                <Link href="/register" className="bg-aerojet-sky text-white px-12 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-aerojet-blue transition-all shadow-lg active:scale-95">
                    Register to View Pricing
                </Link>
            </section>

            <NextSteps />
          </div>
        </div>
      </div>
    </main>
  );
}

