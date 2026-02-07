import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Modular Training',
};

export default function ModularProgrammePage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      
      <div className="grow">
        <PageHero 
          title="Modular Training Programme"
          subtitle="Self-paced, flexible certification paths for EASA Part-66 B1 and B2 licences."
          backgroundImage="/modular.jpg"
        />

        <div className="container mx-auto px-6 py-20">
          <div className="max-w-5xl mx-auto space-y-20">
            
            {/* 1. Programme Overview */}
            <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <div className="w-16 h-1.5 bg-aerojet-sky mb-6 rounded-full" />
                    <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Individual Tuition & Exam</h2>
                    <p className="text-slate-600 leading-relaxed mb-4 font-medium">
                        The Modular Training Programme is our primary route for **individuals** who want expert instruction without committing to a full-time schedule. 
                    </p>
                    <p className="text-slate-500 leading-relaxed text-sm">
                        Unlike "Exam-Only", this option includes **full classroom tuition** for your chosen module, plus the examination sitting fee. You join a scheduled class and receive structured learning support.
                    </p>
                </div>
                <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden border-t-4 border-aerojet-sky">
                    <h3 className="text-xl font-bold mb-6">Modular Rules</h3>
                    <ul className="space-y-5">
                        <li className="flex items-start gap-4">
                            <span className="text-aerojet-sky font-black text-lg">✓</span>
                            <p className="text-sm text-slate-300 font-medium leading-relaxed">Book modules at your own pace through the secure student portal.</p>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="text-aerojet-sky font-black text-lg">✓</span>
                            <p className="text-sm text-slate-300 font-medium leading-relaxed"><b>100% Upfront Payment:</b> Required per booked module to activate access.</p>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="text-red-500 font-black text-lg">!</span>
                            <p className="text-sm text-slate-300 font-medium leading-relaxed"><b>The 24-Month Rule:</b> All exams must be passed within 24 months of the first module pass.</p>
                        </li>
                    </ul>
                </div>
            </div>

            {/* 2. Pricing & Access Information */}
            <section className="bg-slate-50 rounded-[3rem] p-8 md:p-16 border border-slate-100 text-center shadow-inner">
                <h2 className="text-2xl font-black text-aerojet-blue uppercase tracking-widest mb-4">Pricing & Availability</h2>
                <p className="text-slate-500 max-w-2xl mx-auto mb-10 font-medium">
                    To maintain strict cohort standards and up-to-date scheduling, detailed pricing and available dates for modular tuition are visible exclusively within the <b>Student Portal</b> after successful registration.
                </p>
                <div className="flex flex-col md:flex-row justify-center gap-4">
                    <Link href="/register" className="bg-aerojet-sky text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-aerojet-blue transition-all shadow-lg">
                        Register to View Pricing
                    </Link>
                    <Link href="/courses/modules" className="bg-white border-2 border-slate-200 text-slate-600 px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all">
                        View Module List (M1–M17)
                    </Link>
                </div>
            </section>

            {/* 3. Next Steps Verbatim from Master Pack */}
            <section className="pt-10">
                <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-12 text-center">How to Enroll</h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-aerojet-sky transition-all">
                        <span className="text-slate-300 font-black text-xl mb-4 block group-hover:text-aerojet-sky">01</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-2">Registration Invoice</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">We will first issue an invoice for the GHS 350 registration fee. Payment is required before you can complete the online application.</p>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-aerojet-sky transition-all">
                        <span className="text-slate-300 font-black text-xl mb-4 block group-hover:text-aerojet-sky">02</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-2">Online Application</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Once payment is received and confirmed, we will provide a link to complete the online application form for review.</p>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-aerojet-sky transition-all">
                        <span className="text-slate-300 font-black text-xl mb-4 block group-hover:text-aerojet-sky">03</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-2">Confirmation Invoice</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Upon approval, we will issue an invoice for the Confirmation payment. Once paid, your seat is secured.</p>
                    </div>
                    <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm group hover:border-aerojet-sky transition-all">
                        <span className="text-slate-300 font-black text-xl mb-4 block group-hover:text-aerojet-sky">04</span>
                        <h4 className="font-bold text-aerojet-blue text-sm mb-2">Portal Access</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">After confirmation, you will be onboarded to the student portal to access your materials and book your exams.</p>
                    </div>
                </div>
            </section>

          </div>
        </div>
      </div>
    </main>
  );
}
