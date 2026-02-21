import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/marketing/Navbar';
import Footer from '@/components/marketing/Footer';
import PageHero from '@/components/marketing/PageHero';

export const metadata: Metadata = {
  title: 'Revision Support',
};

export default function RevisionSupportPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <div className="grow">
        <PageHero 
          title="Revision Support"
          subtitle="Intensive 8-week tuition blocks designed for organizations and large cohorts."
          backgroundImage="/lecture.jpg"
        />

        <div className="container mx-auto px-6 py-20">
          <div className="max-w-5xl mx-auto space-y-20">
            
            {/* 1. Programme Concept */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <div className="w-16 h-1.5 bg-aerojet-sky mb-6 rounded-full" />
                    <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Group Learning Solution</h2>
                    <p className="text-slate-600 leading-relaxed mb-4 font-medium">
                        Our Revision Support clinics are designed for **organizations, airlines, or pre-formed groups** requiring focused preparation for their candidates before EASA examinations.
                    </p>
                    <p className="text-slate-500 leading-relaxed text-sm">
                        This 8-week intensive series provides deep-dive tuition and mock exams. It is not available for individual booking.
                    </p>
                    <div className="mt-6 p-4 bg-orange-50 border-l-4 border-orange-400 rounded-r-lg">
                        <p className="text-xs font-bold text-orange-800 uppercase tracking-widest mb-1">Individual Student?</p>
                        <p className="text-xs text-orange-700">Please view our <Link href="/courses/easa-modular" className="underline font-bold">Modular Training Programme</Link> which allows individuals to book tuition per module.</p>
                    </div>
                </div>
                <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden border-t-4 border-aerojet-sky">
                    <h3 className="text-xl font-black uppercase tracking-tight mb-6 text-aerojet-sky">Booking Requirements</h3>
                    <ul className="space-y-6">
                        <li className="flex gap-4">
                            <span className="shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm">20+</span>
                            <div>
                                <p className="font-bold text-sm">Minimum Group Size</p>
                                <p className="text-xs text-slate-400 leading-relaxed">Bookings are only accepted for cohorts of 20 or more candidates.</p>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <span className="shrink-0 w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-sm">8W</span>
                            <div>
                                <p className="font-bold text-sm">Block Duration</p>
                                <p className="text-xs text-slate-400 leading-relaxed">The curriculum is fixed to an 8-week intensive schedule per module.</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            {/* 2. Format Details */}
            <section className="bg-slate-50 rounded-[3rem] p-10 border border-slate-200">
                <h2 className="text-2xl font-black text-aerojet-blue uppercase tracking-tight mb-8 text-center">The 8-Week Structure</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <span className="text-aerojet-sky font-black text-4xl block mb-2">01</span>
                        <h4 className="font-bold text-slate-800 text-sm uppercase mb-2">Tuition Clinics</h4>
                        <p className="text-[11px] text-slate-500">Weekly classroom sessions focusing on core syllabus topics.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <span className="text-aerojet-sky font-black text-4xl block mb-2">02</span>
                        <h4 className="font-bold text-slate-800 text-sm uppercase mb-2">Mid-Point Mock</h4>
                        <p className="text-[11px] text-slate-500">A full mock examination at Week 4 to assess progress.</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <span className="text-aerojet-sky font-black text-4xl block mb-2">03</span>
                        <h4 className="font-bold text-slate-800 text-sm uppercase mb-2">Final Mock</h4>
                        <p className="text-[11px] text-slate-500">Exam-condition simulation at Week 8 before the official sitting.</p>
                    </div>
                </div>
            </section>

            {/* 3. CTA for Groups */}
            <div className="text-center pt-8">
                <h2 className="text-2xl font-black text-aerojet-blue uppercase tracking-tight mb-4">Corporate & Group Enquiry</h2>
                <p className="text-slate-500 mb-8 max-w-lg mx-auto text-sm">
                    Representing an organization? Contact us to discuss scheduling a dedicated revision block for your team.
                </p>
                <Link href="/contact" className="bg-aerojet-blue text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-aerojet-sky transition-all shadow-lg">
                    Contact Corporate Admissions
                </Link>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

