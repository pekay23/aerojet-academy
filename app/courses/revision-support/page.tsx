import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Revision Support',
};

export default function RevisionSupportPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <div className="grow">
        <PageHero 
          title="Revision Support"
          subtitle="Targeted tuition and mock examinations designed to ensure exam-day confidence for EASA candidates."
          backgroundImage="/lecture.jpg"
        />

        <div className="container mx-auto px-6 py-20">
          <div className="max-w-5xl mx-auto space-y-20">
            
            {/* 1. Programme Concept */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <div className="w-16 h-1.5 bg-aerojet-sky mb-6 rounded-full" />
                    <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Focused Exam Preparation</h2>
                    <p className="text-slate-600 leading-relaxed mb-4 font-medium">
                        Need extra preparation? Our Revision Support clinics are targeted tuition add-ons for exam-only candidates who require focused review before sitting their official EASA Part-66 modules.
                    </p>
                    <p className="text-slate-500 leading-relaxed text-sm">
                        Each module series runs for a 8-week block, providing a deep dive into core concepts and difficult subject areas. Timings rotate based on demand and instructor availability.
                    </p>
                </div>
                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                    <h3 className="text-xl font-black text-aerojet-blue uppercase tracking-tight mb-6">The 8-Week Format</h3>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="shrink-0 w-8 h-8 rounded-lg bg-aerojet-sky text-white flex items-center justify-center font-bold text-xs">01</div>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed"><b>Weekly Clinics:</b> Specialized classroom sessions focusing on the official EASA syllabus.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="shrink-0 w-8 h-8 rounded-lg bg-aerojet-sky text-white flex items-center justify-center font-bold text-xs">02</div>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed"><b>Mock Exam 1 (Week 4):</b> A mid-point assessment to identify knowledge gaps early.</p>
                        </div>
                        <div className="flex gap-4">
                            <div className="shrink-0 w-8 h-8 rounded-lg bg-aerojet-sky text-white flex items-center justify-center font-bold text-xs">03</div>
                            <p className="text-sm text-slate-600 font-medium leading-relaxed"><b>Mock Exam 2 (Week 8):</b> A final simulation to verify readiness for the official sitting.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Example Timetable & Pricing */}
            <section className="bg-slate-900 text-white rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-5">
                    <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"/></svg>
                </div>

                <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tight mb-6">Timetable & Pricing</h2>
                        <p className="text-slate-400 leading-relaxed mb-8">
                            Revision classes typically run <b>Monday to Friday, 14:00 – 17:00</b>. Candidates must book the full 8-weeks series for their chosen module.
                        </p>
                        <div className="p-6 bg-white/5 rounded-2xl border border-white/10 inline-block">
                            <p className="text-[10px] font-black text-aerojet-sky uppercase tracking-widest mb-1">Tuition Fees</p>
                            <p className="text-2xl font-black uppercase">Pricing visible in Portal</p>
                            <p className="text-xs text-slate-500 mt-1">Price Per Module</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-4xl p-8 text-slate-900 shadow-xl">
                        <h3 className="font-black text-aerojet-blue uppercase text-sm tracking-widest mb-6 border-b pb-4">Indicative Schedule</h3>
                        <div className="space-y-4 font-mono text-sm">
                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="font-bold text-slate-400">M2 Physics</span>
                                <span className="text-aerojet-sky">Active Block</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="font-bold text-slate-400">M4 Electronics</span>
                                <span className="text-aerojet-sky">Active Block</span>
                            </div>
                            <div className="flex justify-between border-b border-slate-50 pb-2">
                                <span className="font-bold text-slate-400">M10 Legislation</span>
                                <span className="text-slate-300 italic">Coming Next</span>
                            </div>
                        </div>
                        <p className="mt-6 text-[10px] text-slate-400 leading-tight">
                            * Timings and module availability are subject to demand. Minimum class sizes apply.
                        </p>
                    </div>
                </div>
            </section>

            {/* 3. Next Steps Verbatim */}
            <section className="pt-10">
                <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-12 text-center">How to Enroll</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-aerojet-sky font-black text-xl mb-4 block">01</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-2">Registration Invoice</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Pay the GHS 350 fee to activate your account and unlock programme details.</p>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-aerojet-sky font-black text-xl mb-4 block">02</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-2">Online Application</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Once confirmed, submit your online form for Academy review and approval.</p>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-aerojet-sky font-black text-xl mb-4 block">03</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-2">Confirmation Invoice</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Upon approval, pay the block tuition fee to secure your seat in the revision series.</p>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <span className="text-aerojet-sky font-black text-xl mb-4 block">04</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-2">Portal Access</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Receive your link to access the learning materials and joined the scheduled clinics.</p>
                    </div>
                </div>

                <div className="mt-16 text-center">
                    <Link href="/register" className="bg-aerojet-sky text-white px-12 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-aerojet-blue shadow-lg transition-all active:scale-95">
                        Register for Revision Support
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
