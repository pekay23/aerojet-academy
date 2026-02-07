import { Metadata } from 'next';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PageHero from '@/components/PageHero';

export const metadata: Metadata = {
  title: 'Entry Requirements',
};

export default function EntryRequirementsPage() {
  return (
    <main className="min-h-screen flex flex-col bg-slate-50">
      
      <div className="grow">
        <PageHero 
          title="Entry Requirements"
          subtitle="Ensure you meet the academic and professional criteria for our EASA programmes."
          backgroundImage="/entry1.jpg"
        />

        <div className="container mx-auto px-6 py-20">
          <div className="max-w-5xl mx-auto space-y-16">
            
            {/* 1. General & Full-Time Requirements */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-1 bg-aerojet-sky rounded-full" />
                    <h2 className="text-2xl font-black text-aerojet-blue uppercase tracking-tight">Full-Time & Crash Courses</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-2">Age Requirement</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Applicants must be a minimum of 18 years old at the time of course commencement.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-2">Academic Background</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            A High School Diploma, WASSCE, or equivalent is required. Strong credits in <b>Mathematics, Physics, and English</b> are highly recommended.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-2">Language Proficiency</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            All training is conducted in English. Applicants must demonstrate proficiency in reading, writing, and speaking the English language.
                        </p>
                    </div>

                    <div className="bg-white p-8 rounded-4xl border border-slate-200 shadow-sm">
                        <h3 className="font-bold text-slate-800 mb-2">Aptitude Assessment</h3>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            Shortlisted applicants for full-time cohorts must pass an internal aptitude test to assess technical comprehension.
                        </p>
                    </div>
                </div>
            </section>

            {/* 2. Modular & Exam-Only Requirements */}
            <section className="bg-aerojet-blue rounded-[3rem] p-10 md:p-16 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                    <svg className="w-40 h-40" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                </div>
                
                <div className="relative z-10">
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Modular & Exam-Only Candidates</h2>
                    <div className="grid md:grid-cols-2 gap-10">
                        <div>
                            <h4 className="font-bold text-aerojet-sky uppercase text-xs tracking-widest mb-3">Professional Standing</h4>
                            <p className="text-blue-100 text-sm leading-relaxed">
                                Self-study and modular candidates are expected to have a foundational understanding of aviation maintenance or be working under an existing MRO framework.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-bold text-aerojet-sky uppercase text-xs tracking-widest mb-3">Identification</h4>
                            <p className="text-blue-100 text-sm leading-relaxed">
                                A valid Passport or National ID is mandatory for all examination bookings to comply with EASA invigilation standards.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* 3. Help / FAQ CTA */}
            <div className="text-center bg-white border border-slate-200 p-12 rounded-[3rem] shadow-sm">
                <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-4">Unsure of your eligibility?</h2>
                <p className="text-slate-500 mb-10 max-w-xl mx-auto font-medium">
                    Our admissions team can provide a preliminary review of your transcripts or professional experience.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/contact" className="bg-aerojet-sky text-white px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-aerojet-blue transition-all shadow-lg">
                        Contact Admissions
                    </Link>
                    <Link href="/admissions/fees" className="bg-slate-100 text-slate-600 px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all">
                        View Payment Rules
                    </Link>
                </div>
            </div>

          </div>
        </div>
      </div>

    </main>
  );
}
