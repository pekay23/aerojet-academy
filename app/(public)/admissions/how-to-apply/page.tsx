import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/app/components/marketing/Navbar';
import Footer from '@/app/components/marketing/Footer';
import PageHero from '@/app/components/marketing/PageHero';

export const metadata: Metadata = {
  title: 'How to Enroll',
};

const documents = [
  "Passport or National ID card copy",
  "High School Diploma / WASSCE Certificate",
  "Official Academic Transcripts",
  "Recent passport-sized photograph",
  "English Language Proficiency (if required)"
];

export default function HowToApplyPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      <div className="grow">
        <PageHero 
          title="How to Enroll"
          subtitle="Your step-by-step roadmap to joining Aerojet Academy."
          backgroundImage="/takeoff.jpg"
        />
        <div className="container mx-auto px-6 py-20">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-3 gap-16">
            
            {/* --- Main Content: The 4 Steps --- */}
            <div className="lg:col-span-2 space-y-12">
                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100">
                    <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-10">The Enrollment Process</h2>
                    
                    <div className="space-y-12 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-100 z-0" />

                        <div className="relative z-10 flex gap-6">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-aerojet-sky text-white flex items-center justify-center font-black">1</div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Registration Invoice</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mt-1">We will first issue an invoice for the GHS 350 registration fee. Payment of the registration fee is required before you can complete the online application.</p>
                            </div>
                        </div>

                        <div className="relative z-10 flex gap-6">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-aerojet-sky text-white flex items-center justify-center font-black">2</div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Online Application Form</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mt-1">Once payment is received and you send us confirmation, we will provide a link to complete the online application form for Academy review and approval.</p>
                            </div>
                        </div>

                        <div className="relative z-10 flex gap-6">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-aerojet-sky text-white flex items-center justify-center font-black">3</div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Confirmation Invoice</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mt-1">Upon approval, we will issue an invoice for the Confirmation payment applicable to your selected training programme. Once paid, your seat is secured.</p>
                            </div>
                        </div>

                        <div className="relative z-10 flex gap-6">
                            <div className="shrink-0 w-10 h-10 rounded-full bg-aerojet-sky text-white flex items-center justify-center font-black">4</div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Student Portal Onboarding</h3>
                                <p className="text-sm text-slate-500 leading-relaxed mt-1">After confirmation, you will be onboarded onto our student portal. You will receive confirmation of your start date or access to your learning materials.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 text-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tight text-aerojet-sky">Ready to begin?</h3>
                        <p className="text-slate-400 text-sm mt-1">Request your registration invoice to start.</p>
                    </div>
                    <Link href="/register" className="bg-white text-slate-900 px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-aerojet-sky hover:text-white transition-all whitespace-nowrap">
                        Register Now →
                    </Link>
                </div>
            </div>

            {/* --- Sidebar: Checklist --- */}
            <aside className="lg:col-span-1">
                <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm sticky top-28">
                    <h3 className="font-black text-xs uppercase tracking-[0.2em] mb-6 text-slate-400">Document Checklist</h3>
                    <p className="text-xs text-slate-500 mb-8 font-medium">Please ensure you have these documents ready for your application submission (Step 2):</p>
                    
                    <ul className="space-y-4 mb-10">
                        {documents.map(doc => (
                            <li key={doc} className="flex items-start text-[11px] font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <span className="text-green-500 mr-2 text-base">✓</span>
                                {doc}
                            </li>
                        ))}
                    </ul>

                    <div className="pt-6 border-t border-slate-100">
                        <Link href="/contact" className="text-aerojet-sky font-bold text-xs uppercase tracking-widest hover:underline">
                            Ask a question ↗
                        </Link>
                    </div>
                </div>
            </aside>
          </div>
        </div>
      </div>
    </main>
  );
}

