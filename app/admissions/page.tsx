import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';
import NextSteps from '@/components/NextSteps';

export const metadata: Metadata = {
  title: 'Admissions',
};

const documents = [
  "A copy of your Passport or National ID",
  "High School Diploma / WASSCE Certificate",
  "Official Academic Transcripts",
  "Recent passport-sized photograph",
  "Proof of English language proficiency (if applicable)"
];

export default function AdmissionsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      
      <div className="grow">
        <PageHero 
          title="Admissions & Enrollment"
          subtitle="Start your career in aviation with our clear, structured enrollment process."
          backgroundImage="/admissions.jpg"
        />

        <div className="container mx-auto px-6 py-20">
          <div className="grid lg:grid-cols-3 gap-16">

            {/* --- Main Content: The Roadmap --- */}
            <div className="lg:col-span-2 space-y-12">
              <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100">
                <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-8">
                  Your Path to Enrolment
                </h2>
                
                {/* Verbatim Steps 1-4 from Master Pack */}
                <div className="space-y-10 relative">
                    <div className="absolute left-5 top-2 bottom-2 w-0.5 bg-slate-100 z-0" />
                    
                    <div className="flex gap-6 relative z-10">
                        <div className="shrink-0 w-10 h-10 rounded-full bg-aerojet-sky text-white flex items-center justify-center font-black">1</div>
                        <div>
                            <h3 className="font-bold text-lg text-aerojet-blue">Registration Invoice</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mt-1">We will first issue an invoice for the GHS 350 registration fee. Payment of the registration fee is required before you can complete the online application.</p>
                        </div>
                    </div>

                    <div className="flex gap-6 relative z-10">
                        <div className="shrink-0 w-10 h-10 rounded-full bg-aerojet-sky text-white flex items-center justify-center font-black">2</div>
                        <div>
                            <h3 className="font-bold text-lg text-aerojet-blue">Online Application Form</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mt-1">Once payment is received and you send us confirmation, we will provide a link to complete the online application form for Academy review and approval.</p>
                        </div>
                    </div>

                    <div className="flex gap-6 relative z-10">
                        <div className="shrink-0 w-10 h-10 rounded-full bg-aerojet-sky text-white flex items-center justify-center font-black">3</div>
                        <div>
                            <h3 className="font-bold text-lg text-aerojet-blue">Confirmation Invoice</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mt-1">Upon approval, we will issue an invoice for the Confirmation payment applicable to your selected training program. Once paid, your seat is secured.</p>
                        </div>
                    </div>

                    <div className="flex gap-6 relative z-10">
                        <div className="shrink-0 w-10 h-10 rounded-full bg-aerojet-sky text-white flex items-center justify-center font-black">4</div>
                        <div>
                            <h3 className="font-bold text-lg text-aerojet-blue">Portal Onboarding & Start Date</h3>
                            <p className="text-sm text-slate-500 leading-relaxed mt-1">After confirmation, you will be onboarded onto our student portal. You will receive confirmation of the start date as per the conditions of your course or access to modular learning materials.</p>
                        </div>
                    </div>
                </div>
              </div>

              {/* Simplified NextSteps teaser */}
              <div className="bg-slate-900 rounded-3xl p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                  <div>
                    <h4 className="font-black uppercase tracking-widest text-aerojet-sky mb-1">Ready to Start?</h4>
                    <p className="text-blue-100 text-sm">Request your registration fee invoice today.</p>
                  </div>
                  <Link href="/register" className="bg-white text-slate-900 px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-aerojet-sky hover:text-white transition-all whitespace-nowrap">
                    Start Registration Now
                  </Link>
              </div>
            </div>

            {/* --- Sidebar: Requirements & Checklist --- */}
            <aside className="lg:col-span-1 space-y-8">
              <div className="bg-white p-8 rounded-3xl shadow-lg border-t-4 border-aerojet-sky sticky top-28">
                <h3 className="font-black text-xs uppercase tracking-[0.2em] mb-6 text-slate-400">Document Checklist</h3>
                <p className="text-sm text-slate-600 mb-8 leading-relaxed">Please prepare high-quality digital copies of the following for Step 2 of the process:</p>
                
                <ul className="space-y-4">
                  {documents.map(doc => (
                    <li key={doc} className="flex items-start text-slate-700 text-xs font-bold p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-aerojet-sky transition-colors">
                      <span className="text-green-500 mr-3 text-lg">✓</span>
                      {doc}
                    </li>
                  ))}
                </ul>

                <div className="mt-10 pt-8 border-t border-slate-100">
                    <p className="text-[10px] text-slate-400 uppercase font-black text-center mb-4 tracking-widest">Questions?</p>
                    <Link href="/contact" className="block text-center border-2 border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-widest py-3 rounded-xl hover:bg-slate-50 transition-all">
                        Contact Admissions
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
