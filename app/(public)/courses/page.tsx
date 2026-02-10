import React from 'react';
import { Metadata } from 'next';
import PageHero from '@/app/components/marketing/PageHero';
import Link from 'next/link';
import { Wrench, CheckCircle2, ShieldCheck, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Aircraft Engineering',
  description: 'EASA Part-66 Certified Training in Accra, Ghana.',
};

export default function CoursesLandingPage() {
  return (
    <main className="bg-white min-h-screen">
      <PageHero 
        title="Aircraft Engineering" 
        subtitle="Certified by EASA. Prepare for a global career in Civil Aviation."
        backgroundImage="/coursespage.jpg"
      />

      <div className="container mx-auto px-6 py-20">
        
        {/* Intro Section */}
        <section className="max-w-4xl mx-auto mb-20">
            <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">About the Course</h2>
            <p className="text-lg text-slate-600 leading-relaxed mb-6">
                Certified by the European Union Aviation Safety Agency (EASA), this course prepares you for a career in the 
                Civil Aviation Industry, specifically <strong>Aircraft Maintenance Engineering</strong>. Because this is an 
                internationally certified course, a student has the opportunity to work on operational ‘Live’ commercial 
                aircraft at Aerojet’s Hangar Facility in Ghana or Aerojet’s partner facilities overseas.
            </p>
            
            <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-[#4c9ded]" /> What does it involve?
                </h3>
                <p className="text-slate-600 mb-4">
                    As an aircraft maintenance engineer, your work involves installing, maintaining, replacing, and repairing 
                    the airframe, engines, and other components on an aircraft. You may specialize in:
                </p>
                <ul className="grid sm:grid-cols-2 gap-3">
                    {['Mechanical Engineering', 'Avionics Engineering', 'Structures Engineering'].map((item, i) => (
                        <li key={i} className="flex gap-2 items-center text-sm font-medium text-slate-700">
                            <CheckCircle2 className="w-4 h-4 text-green-500" /> {item}
                        </li>
                    ))}
                </ul>
            </div>
        </section>

        {/* Requirements Strip */}
        <section className="bg-aerojet-blue text-white rounded-[3rem] p-12 mb-20 relative overflow-hidden">
            <div className="relative z-10 max-w-4xl mx-auto text-center">
                <h2 className="text-2xl font-bold mb-6">Prerequisites</h2>
                <div className="grid md:grid-cols-3 gap-8 text-left">
                    <div>
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                            <GraduationCap className="w-6 h-6 text-[#4c9ded]" />
                        </div>
                        <h4 className="font-bold mb-2">Qualifications</h4>
                        <p className="text-sm text-blue-100">SSCE, A-Levels, HND (Math, English, Science) or Bachelor’s Degree.</p>
                    </div>
                    <div>
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                            <ShieldCheck className="w-6 h-6 text-[#4c9ded]" />
                        </div>
                        <h4 className="font-bold mb-2">Clearance</h4>
                        <p className="text-sm text-blue-100">Medical and security background checks required.</p>
                    </div>
                    <div>
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-6 h-6 text-[#4c9ded]" />
                        </div>
                        <h4 className="font-bold mb-2">Assessment</h4>
                        <p className="text-sm text-blue-100">Aptitude test & Interview after registration.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Study Pathways */}
        <section className="mb-20">
            <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-10 text-center">Study Pathways</h2>
            <div className="grid lg:grid-cols-3 gap-8">
                
                {/* Pathway A */}
                <div className="group border border-slate-200 p-8 rounded-3xl hover:shadow-xl transition-all hover:border-[#4c9ded]">
                    <div className="text-xs font-bold text-[#4c9ded] uppercase tracking-widest mb-2">Pathway A</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Full-Time Training</h3>
                    <p className="text-sm text-slate-600 mb-6 line-clamp-4">
                        4-Year structured program. Includes practical hand-skills and mandatory live aircraft environment training (Part-145). Guaranteed job with Aerojet Aviation upon successful completion.
                    </p>
                    <Link href="/courses/easa-full-time" className="text-aerojet-blue font-bold text-sm hover:underline">View Details →</Link>
                </div>

                {/* Pathway B */}
                <div className="group border border-slate-200 p-8 rounded-3xl hover:shadow-xl transition-all hover:border-[#4c9ded]">
                    <div className="text-xs font-bold text-[#4c9ded] uppercase tracking-widest mb-2">Pathway B</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Modular Training</h3>
                    <p className="text-sm text-slate-600 mb-6 line-clamp-4">
                        Flexible assisted learning. Study at your own pace. Includes tuition, materials, and exams per module. Ideal for working professionals.
                    </p>
                    <Link href="/courses/easa-modular" className="text-aerojet-blue font-bold text-sm hover:underline">View Details →</Link>
                </div>

                {/* Pathway C */}
                <div className="group border border-slate-200 p-8 rounded-3xl hover:shadow-xl transition-all hover:border-[#4c9ded]">
                    <div className="text-xs font-bold text-[#4c9ded] uppercase tracking-widest mb-2">Pathway C</div>
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Exam Only</h3>
                    <p className="text-sm text-slate-600 mb-6 line-clamp-4">
                        Self-study option. Access learning materials and book exam slots. Includes online prep sessions. Best for confident self-learners.
                    </p>
                    <Link href="/courses/examination-only" className="text-aerojet-blue font-bold text-sm hover:underline">View Details →</Link>
                </div>

            </div>
        </section>

        {/* How to Book */}
        <div className="bg-slate-50 p-10 rounded-3xl text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">How to Book With Us</h2>
            <div className="max-w-2xl mx-auto text-left space-y-4">
                {[
                    "Pay and Register with the Training Academy.",
                    "Log in with your credentials.",
                    "Browse any course you want and buy your preferred course when ready.",
                    "Book your exam date, course start date, or tuition slots.",
                    "Gain lifetime access to the portal with a one-time registration."
                ].map((step, i) => (
                    <div key={i} className="flex gap-4 items-start">
                        <span className="shrink-0 w-6 h-6 bg-aerojet-blue text-white rounded-full flex items-center justify-center text-xs font-bold">{i+1}</span>
                        <p className="text-slate-600 text-sm">{step}</p>
                    </div>
                ))}
            </div>
            <div className="mt-8">
                <Link href="/register" className="inline-block bg-[#4c9ded] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-sm hover:bg-aerojet-blue transition-all">
                    Register Now
                </Link>
            </div>
        </div>

      </div>
    </main>
  );
}
