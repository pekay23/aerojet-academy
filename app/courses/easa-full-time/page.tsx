import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Full-Time Programmes',
};

const programs = [
  {
    id: "A",
    title: "4-Year B1.1 & B2 Licence Programme",
    who: "School leavers seeking the highest global standard in dual-category certification.",
    includes: ["Comprehensive Theory", "Advanced Hand-Skills", "Structured Work Experience", "Exam fees + 2 free re-sits", "Logbook, PPE & Materials"]
  },
  {
    id: "B",
    title: "2-Year B1.1 Licence Programme",
    who: "Fast-track candidates focusing on Mechanical (Turbine) certification.",
    includes: ["Intensive Theory", "Practical Hand-Skills", "PPE & Materials", "Exam fees + 2 free re-sits", "Optional B2 top-up blocks"]
  },
  {
    id: "C",
    title: "12-Month Engineer Certification",
    who: "Industry or Military professionals needing EASA B1.1 theory & exams only.",
    includes: ["B1.1 Theory Modules", "All EASA Examinations", "Evening & Saturday classes", "No hand-skills training", "Designed for working pros"]
  }
];

export default function FullTimeCoursesPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <Navbar />
      
      <div className="grow">
        <PageHero 
          title="Full-Time Programmes"
          subtitle="Immersive, EASA-standard training pathways designed to produce elite Aircraft Maintenance Engineers."
          backgroundImage="/4-yrFull-time.jpg"
        />

        <div className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto space-y-24">
            
            {/* 1. The Three Pathways */}
            <section>
                <div className="text-center mb-16">
                    <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight">Choose Your Category</h2>
                    <p className="text-slate-500 mt-2 font-medium">We offer three distinct full-time routes depending on your experience and goals.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {programs.map((prog) => (
                        <div key={prog.id} className="bg-slate-50 rounded-4xl p-8 border border-slate-100 flex flex-col hover:shadow-xl transition-all duration-500 group">
                            <div className="w-12 h-12 bg-aerojet-blue text-white rounded-xl flex items-center justify-center font-black mb-6 group-hover:bg-aerojet-sky transition-colors">
                                {prog.id}
                            </div>
                            <h3 className="text-xl font-black text-aerojet-blue leading-tight mb-4">{prog.title}</h3>
                            
                            <div className="mb-6">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Audience</p>
                                <p className="text-sm text-slate-600 leading-relaxed">{prog.who}</p>
                            </div>

                            <div className="grow">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Programme Includes</p>
                                <ul className="space-y-2">
                                    {prog.includes.map(item => (
                                        <li key={item} className="flex items-start text-xs font-bold text-slate-500">
                                            <span className="text-aerojet-sky mr-2 text-lg">✓</span> {item}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-200">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pricing Structure</p>
                                <p className="text-sm font-bold text-aerojet-sky mt-1">Pricing visible in Student Portal</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 2. Payment Milestones Section remains mostly same but uses generic phrasing */}
            <section className="bg-aerojet-blue rounded-[3rem] p-8 md:p-16 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                </div>
                
                <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl font-black uppercase tracking-tight mb-6">Payment Milestones</h2>
                        <p className="text-blue-100 leading-relaxed mb-8 font-medium">
                            Aerojet Academy utilizes a milestone-based payment structure to help students and sponsors manage the investment across the academic year.
                        </p>
                        <div className="space-y-4 text-sm font-bold uppercase tracking-widest">
                            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10">
                                <span className="text-aerojet-sky">Step 1</span>
                                <p>GHS 350 Registration Fee</p>
                            </div>
                            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl border border-white/10">
                                <span className="text-aerojet-sky">Step 2</span>
                                <p>40% Seat Confirmation Deposit</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-4xl p-8 text-slate-900 shadow-xl">
                        <h3 className="font-black text-aerojet-blue uppercase text-sm tracking-widest mb-6">Annual Balance Schedule</h3>
                        <div className="space-y-6">
                            <div className="border-l-4 border-aerojet-sky pl-4">
                                <p className="font-black text-lg">Semester 1</p>
                                <p className="text-sm text-slate-500">Remaining balance split into predictable installments.</p>
                            </div>
                            <div className="border-l-4 border-slate-200 pl-4">
                                <p className="font-black text-lg">Portal Access</p>
                                <p className="text-sm text-slate-500 font-medium">Log in to view your personalized payment plan and due dates.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Next Steps Verbatim */}
            <section className="text-center py-10">
                <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-12">How to Enroll</h2>
                <div className="grid md:grid-cols-4 gap-6 text-left">
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-aerojet-sky font-black text-xl mb-2 block">01</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-2">Registration Invoice</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">We will first issue an invoice for the GHS 350 registration fee. Payment is required before you can complete the online application.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-aerojet-sky font-black text-xl mb-2 block">02</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-2">Online Application</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Once payment is received and confirmed, we will provide a link to complete the online application form for review.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-aerojet-sky font-black text-xl mb-2 block">03</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-2">Confirmation Invoice</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Upon approval, we will issue an invoice for the Confirmation payment (40%). Once paid, your seat is secured.</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-aerojet-sky font-black text-xl mb-2 block">04</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-2">Start Training</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">After confirmation, you will be onboarded to the student portal and receive confirmation of your start date.</p>
                    </div>
                </div>
                
                <div className="mt-16">
                    <Link href="/register" className="bg-aerojet-sky text-white px-12 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:bg-aerojet-blue shadow-lg transition-all active:scale-95">
                        Begin Registration Now
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
