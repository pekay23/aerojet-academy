import { Metadata } from 'next';
import Link from 'next/link';
// Navbar and Footer REMOVED (Handled by Layout)
import PageHero from '@/app/components/marketing/PageHero';
import { ArrowRight, CheckCircle2, BookOpen, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Admissions',
};

export default function AdmissionsHub() {
  return (
    // Removed the outer <main> because the Layout already provides one
    <div className="bg-slate-50 min-h-screen">
      
        <PageHero 
          title="Join the Next Generation"
          subtitle="Your journey to a global aviation career starts with a simple first step."
          backgroundImage="/admissions.jpg"
        />

        <div className="container mx-auto px-6 py-20">
          
          {/* Intro Section */}
          <div className="max-w-3xl mx-auto text-center mb-20">
            <h2 className="text-3xl font-black text-aerojet-blue uppercase tracking-tight mb-6">Why Choose Aerojet?</h2>
            <p className="text-slate-600 text-lg leading-relaxed">
              We don't just teach theory; we build careers. Our admissions process is designed to identify and cultivate the most dedicated future engineers. Whether you are a fresh graduate or a professional upskilling, we have a pathway for you.
            </p>
          </div>

          {/* Navigation Cards - (Applied the Icon Fix Here too) */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            
            {/* Card 1: Requirements */}
            <Link href="/admissions/entry-requirements" className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-aerojet-blue transition-all">
              <div className="w-14 h-14 bg-blue-50 text-aerojet-blue rounded-2xl flex items-center justify-center mb-6 group-hover:bg-aerojet-blue group-hover:text-white transition-colors duration-300">
                <CheckCircle2 className="w-8 h-8 text-current" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-aerojet-blue transition-colors">Entry Requirements</h3>
              <p className="text-slate-500 text-sm mb-6">Check your eligibility. We accept WASSCE, High School Diplomas, and mature professional entry.</p>
              <span className="text-xs font-black uppercase tracking-widest text-aerojet-blue flex items-center gap-2">Check Criteria <ArrowRight className="w-4 h-4" /></span>
            </Link>

            {/* Card 2: Process */}
            <Link href="/admissions/how-to-apply" className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-aerojet-blue transition-all">
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors duration-300">
                <BookOpen className="w-8 h-8 text-current" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-purple-600 transition-colors">How to Apply</h3>
              <p className="text-slate-500 text-sm mb-6">A step-by-step guide to our application portal, from registration fee to your first day of class.</p>
              <span className="text-xs font-black uppercase tracking-widest text-purple-600 flex items-center gap-2">View Roadmap <ArrowRight className="w-4 h-4" /></span>
            </Link>

            {/* Card 3: Fees */}
            <Link href="/admissions/fees" className="group bg-white p-8 rounded-3xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-aerojet-blue transition-all">
              <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-600 group-hover:text-white transition-colors duration-300">
                <GraduationCap className="w-8 h-8 text-current" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-green-600 transition-colors">Fees & Finance</h3>
              <p className="text-slate-500 text-sm mb-6">Transparent pricing. Understand our registration fees, tuition deposits, and flexible payment plans.</p>
              <span className="text-xs font-black uppercase tracking-widest text-green-600 flex items-center gap-2">See Pricing <ArrowRight className="w-4 h-4" /></span>
            </Link>

          </div>

          {/* CTA Strip */}
          <div className="bg-aerojet-blue rounded-[3rem] p-12 text-center text-white relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Ready to Commit?</h2>
                <p className="text-blue-100 mb-8 max-w-xl mx-auto">Applications are currently open for the 2026/2027 Academic Year. Slots are limited.</p>
                <Link href="/register" className="inline-block bg-white text-aerojet-blue px-10 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 transition-all">
                    Start Registration Now
                </Link>
              </div>
          </div>

        </div>
    </div>
  );
}

